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
    builder.Services.AddAdspForPlatformService(new AdspOptions
    {
      ServiceId = AdspId.Parse(adspConfiguration.GetValue<string>("ServiceId")),
      ClientSecret = adspConfiguration.GetValue<string>("ClientSecret"),
      AccessServiceUrl = adspConfiguration.GetValue<Uri>("AccessServiceUrl"),
      DirectoryUrl = adspConfiguration.GetValue<Uri>("DirectoryUrl")
    });

    var app = builder.Build();

    app.UseSwagger(new SwaggerOptions { RouteTemplate = "docs/{documentName}/swagger.json" });

    app.UseAuthorization();
    app.UseAdsp();
    app.MapControllers();

    app.Run();
  }
}
