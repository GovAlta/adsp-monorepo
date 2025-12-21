using Adsp.Platform.ScriptService.Events;
using Adsp.Platform.ScriptService.Model;
using Adsp.Platform.ScriptService.Services;
using Adsp.Sdk;
using Adsp.Sdk.Amqp;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Swagger;

namespace Adsp.Platform.ScriptService;

internal sealed class Program
{
  private static void Main(string[] args)
  {
    var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
    var builder = WebApplication.CreateBuilder(args);

    builder.Services.AddCors(options =>
      {
        options.AddPolicy(name: MyAllowSpecificOrigins,
          policy =>
          {
            policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
          });
      }
    );
    builder.Logging.ClearProviders();
    builder.Logging.AddConsole();

    // Add services to the container.
    builder.Services.AddLogging();
    builder.Services.AddControllers();
    // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(
      c =>
      {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
          Title = "Script Service",
          Version = "v1",
          Description = "The script service executes pre-configured scripts and allows applications to externalize logic to configuration."
        });

        var bearerScheme = new OpenApiSecurityScheme
        {
          BearerFormat = "JWT",
          Scheme = "bearer",
          Type = SecuritySchemeType.Http
        };
        c.AddSecurityDefinition("accessToken", bearerScheme);

        var securityRequirements = new OpenApiSecurityRequirement
        {
            { bearerScheme, Array.Empty<string>() },
        };
        c.AddSecurityRequirement(securityRequirements);
      }
    );

    var adspConfiguration = builder.Configuration.GetSection("Adsp");
    builder.Services.Configure<AdspOptions>(adspConfiguration);
    var amqpConfiguration = builder.Configuration.GetSection("Amqp");
    builder.Services.Configure<AmqpConnectionOptions>(amqpConfiguration);

    builder.Services.AddAdspForPlatformService(
      options =>
      {
        var serviceId = AdspId.Parse(adspConfiguration.GetValue<string>("ServiceId"));
        options.ServiceId = serviceId;
        options.DisplayName = "Script service";
        options.Description = "Service that execute configured scripts.";
        options.Configuration = new ConfigurationDefinition<Dictionary<string, ScriptDefinition>>(
          "Definitions of the scripts available to run.",
          (tenant, core) => new ScriptConfiguration(tenant, core)
        );
        options.Roles = new[] {
          new ServiceRole {
            Role = ServiceRoles.ScriptRunner,
            Description = "Script runner role that allows execution of scripts.",
            InTenantAdmin = true
          },
          new ServiceRole {
            Role = ServiceRoles.ScriptService,
            Description =
              "Script service role assigned to the service account. Use this role to grant scripts permission in other services."
          }
        };
        options.Events = new DomainEventDefinition[] {
          new DomainEventDefinition<ScriptExecuted>(
            ScriptExecuted.EventName,
            "Signalled when a script is executed."
          ),
          new DomainEventDefinition<ScriptExecutionFailed>(
            ScriptExecutionFailed.EventName,
            "Signalled when a script execution fails."
          )
        };
        options.EventStreams = new StreamDefinition[] {
          new StreamDefinition("script-execution-updates", "Script execution updates") {
            Description = "Provides update events for script execution.",
            PublicSubscribe = false,
            SubscriberRoles = new[] { $"{serviceId}:{ServiceRoles.ScriptRunner}" },
            Events = new EventIdentity[] {
              new EventIdentity(serviceId.Service!, ScriptExecuted.EventName),
              new EventIdentity(serviceId.Service!, ScriptExecutionFailed.EventName),
            }
          }
        };
        options.Values = new ValueDefinition[] {
          ServiceMetrics.Definition
        };
        options.EnableConfigurationInvalidation = true;
      }
    );
    builder.Services.AddQueueSubscriber<IDictionary<string, object?>, ScriptSubscriber>("event-script-runs");
    builder.Services.AddSingleton<ILuaScriptService, LuaScriptService>();

    var app = builder.Build();
    app.UseAdspMetrics();
    app.UseCors(MyAllowSpecificOrigins);
    app.UseSwagger(new SwaggerOptions { RouteTemplate = "docs/{documentName}/swagger.json" });

    app.UseAuthorization();
    app.UseAdsp();
    app.UseAdspMetadata(new AdspMetadataOptions
    {
      SwaggerJsonPath = "docs/v1/swagger.json",
      ApiPath = "script/v1"
    });
    app.MapControllers();

    app.Run();
  }
}
