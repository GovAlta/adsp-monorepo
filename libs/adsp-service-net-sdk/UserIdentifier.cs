using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Adsp.Sdk;

public class UserIdentifier
{

  private readonly string _id;
  private readonly string? _name;

  [JsonPropertyName("id")]
  [Required]
  public string Id { get { return _id; } }
  [JsonPropertyName("name")]
  public string? Name { get { return _name; } }

  public UserIdentifier(string id, string? name)
  {
    _id = id;
    _name = name;
  }
}
