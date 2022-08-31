using Adsp.Platform.ScriptService.Events;
using Adsp.Platform.ScriptService.Model;
using Adsp.Platform.ScriptService.Services;
using Adsp.Sdk;
using Adsp.Sdk.Amqp;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Swagger;

namespace Adsp.Platform.ScriptService;
internal class Program
{
  private static void Main(string[] args)
  {
    var builder = WebApplication.CreateBuilder(args);
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
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "Script Service", Version = "v1" });
      }
    );

    var adspConfiguration = builder.Configuration.GetSection("Adsp");
    builder.Services.Configure<AdspOptions>(adspConfiguration);
    var amqpConfiguration = builder.Configuration.GetSection("Amqp");
    builder.Services.Configure<AmqpConnectionOptions>(amqpConfiguration);

    builder.Services.AddAdspForPlatformService(
      options =>
      {
        options.ServiceId = AdspId.Parse(adspConfiguration.GetValue<string>("ServiceId"));
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
        options.EnableConfigurationInvalidation = true;
      }
    );
    builder.Services.AddQueueSubscriber<IDictionary<string, object?>, ScriptSubscriber>("event-script-runs");
    builder.Services.AddSingleton<ILuaScriptService, LuaScriptService>();

    var app = builder.Build();

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
