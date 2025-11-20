using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Adsp.Sdk.Utils;

namespace Adsp.Sdk;

[JsonConverter(typeof(AdspIdJsonConverter))]
public class AdspId : IEquatable<AdspId>
{
  private static readonly Regex UrnRegex = new(
    "^(?i:urn):ads(?<namespace>:[a-zA-Z0-9-]{1,50})(?<service>:[a-zA-Z0-9-]{1,50})?(?<api>:[a-zA-Z0-9-]{1,50})?(?<resource>:[a-zA-Z0-9-_/ ]{1,1000})?$",
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

  public bool Equals(AdspId? other)
  {
    return other != null && (Type, Namespace, Service, Api, Resource).Equals(
      (other.Type, other.Namespace, other.Service, other.Api, other.Resource)
    );
  }

  public override bool Equals(object? obj)
  {
    if (obj is AdspId other)
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
    return HashCode.Combine(Type, Namespace, Service, Api, Resource);
  }
}
