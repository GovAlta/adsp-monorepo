namespace Adsp.Sdk;
public static class AdspPlatformServices
{
  public static readonly AdspId TenantServiceId = AdspId.Parse("urn:ads:platform:tenant-service");
  public static readonly AdspId ConfigurationServiceId = AdspId.Parse("urn:ads:platform:configuration-service");
  public static readonly AdspId EventServiceId = AdspId.Parse("urn:ads:platform:event-service");
  public static readonly AdspId PushServiceId = AdspId.Parse("urn:ads:platform:push-service");
  public static readonly AdspId FileServiceId = AdspId.Parse("urn:ads:platform:file-service");
  public static readonly AdspId PdfServiceId = AdspId.Parse("urn:ads:platform:pdf-service");
}
