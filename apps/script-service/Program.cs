using Adsp.Platform.ScriptService.Events;
using Adsp.Platform.ScriptService.Model;
using Adsp.Platform.ScriptService.Services;
using Adsp.Sdk;
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
    builder.Services.AddAdspForPlatformService(
      new AdspOptions
      {
        DisplayName = "Script service",
        Description = "Service that execute configured scripts.",
        ServiceId = AdspId.Parse(adspConfiguration.GetValue<string>("ServiceId")),
        ClientSecret = adspConfiguration.GetValue<string>("ClientSecret"),
        AccessServiceUrl = adspConfiguration.GetValue<Uri>("AccessServiceUrl"),
        DirectoryUrl = adspConfiguration.GetValue<Uri>("DirectoryUrl"),
        Configuration = new ConfigurationDefinition<Dictionary<string, ScriptDefinition>>(
          "Definitions of the scripts available to run.",
          (tenant, core) =>
          {
            var combined = new Dictionary<string, ScriptDefinition>();
            if (tenant is IDictionary<string, ScriptDefinition> tenantDefinitions)
            {
              foreach (var entry in tenantDefinitions)
              {
                combined[entry.Key] = entry.Value;
              }
            }

            if (core is IDictionary<string, ScriptDefinition> coreDefinitions)
            {
              foreach (var entry in coreDefinitions)
              {
                combined[entry.Key] = entry.Value;
              }
            }

            return combined;
          }
        ),
        Roles = new[] {
          new ServiceRole {
            Role = ServiceRoles.ScriptRunner,
            Description = "Script runner role that allows execution of scripts.",
            InTenantAdmin = true
          }
        },
        Events = new[] {
          new DomainEventDefinition<ScriptExecuted>(
            ScriptExecuted.EVENT_NAME,
            "Signalled when a script is executed."
          )
        }
      }
    );
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
