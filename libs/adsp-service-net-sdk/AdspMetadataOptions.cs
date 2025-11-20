namespace Adsp.Sdk;

public class AdspMetadataOptions
{
  public string? SwaggerJsonPath { get; set; } = "swagger/v1/swagger.json";

  public string? HealthCheckPath { get; set; }

  public string? ApiPath { get; set; }
}
