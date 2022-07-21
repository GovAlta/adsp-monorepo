using System.Text.RegularExpressions;

namespace Adsp.Sdk;
public class AdspId
{
  private static readonly Regex UrnRegex = new Regex(
    "^(?i:urn):ads(?<namespace>:[a-z0-9-]{1,30})?(?<service>:[a-z0-9-]{1,30})?(?<api>:[a-z0-9-]{1,30})?(?<resource>:[a-zA-Z0-9-_/ ]{1,1000})?$",
    RegexOptions.Singleline | RegexOptions.CultureInvariant
  );

  public static AdspId Parse(string? urn)
  {
    if (String.IsNullOrEmpty(urn))
    {
      throw new ArgumentNullException(nameof(urn));
    }

    var match = UrnRegex.Match(urn);
    var @namespace = match.Groups["namespace"].Value.TrimStart(':');
    var service = match.Groups["service"].Value.TrimStart(':');
    var api = match.Groups["api"].Value.TrimStart(':');
    var resource = match.Groups["resource"].Value.TrimStart(':');

    ResourceType? type = null;
    if (!String.IsNullOrEmpty(resource))
    {
      type = ResourceType.Resource;
    }
    else if (!String.IsNullOrEmpty(api))
    {
      type = ResourceType.Api;
    }
    else if (!String.IsNullOrEmpty(service))
    {
      type = ResourceType.Service;
    }
    else if (!String.IsNullOrEmpty(@namespace))
    {
      type = ResourceType.Namespace;
    }

    if (type == null || (type == ResourceType.Resource && String.IsNullOrEmpty(api)))
    {
      throw new ArgumentException($"Specified urn '{urn}' is not an ADSP ID.");
    }

    return new AdspId((ResourceType)type, @namespace, service, api, resource);
  }

  public static AdspId Parse(Uri? urn)
  {
    return Parse(urn?.ToString());
  }

  private readonly ResourceType _type;
  public ResourceType Type
  {
    get { return _type; }
  }

  private readonly string _namespace;
  public string Namespace
  {
    get { return _namespace; }
  }

  private readonly string? _service;
  public string? Service
  {
    get { return _service; }
  }

  private readonly string? _api;
  public string? Api
  {
    get { return _api; }
  }

  private readonly string? _resource;
  public string? Resource
  {
    get { return _resource; }
  }

  private AdspId(ResourceType type, string @namespace, string? service, string? api, string? resource)
  {
    _type = type;
    _namespace = @namespace;
    _service = service;
    _api = api;
    _resource = resource;
  }

  public override string ToString()
  {
    return $"urn:ads:{Namespace}" +
      $"{(!String.IsNullOrEmpty(Service) ? $":{Service}" : "")}" +
      $"{(!String.IsNullOrEmpty(Api) ? $":{Api}" : "")}" +
      $"{(!String.IsNullOrEmpty(Resource) ? $":{Resource}" : "")}";
  }

  public bool Equals(AdspId other)
  {
    return other != null && (Type, Namespace, Service, Api, Resource).Equals(
      (other.Type, other.Namespace, other.Service, other.Api, other.Resource)
    );
  }

  public override bool Equals(object? obj)
  {
    var other = obj as AdspId;
    if (other != null)
    {
      return Equals(other);
    }
    else
    {
      return base.Equals(obj);
    }
  }

  public override int GetHashCode()
  {
    return (Type, Namespace, Service, Api, Resource).GetHashCode();
  }
}
