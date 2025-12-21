using System.Text.Json.Serialization;

namespace Adsp.Sdk;

public class FileType
{
  [JsonPropertyName("id")]
  public string Id { get; private set; }

  [JsonPropertyName("name")]
  public string Name { get; private set; }

  [JsonPropertyName("anonymousRead")]
  public bool AnonymousRead { get; set; }

  [JsonPropertyName("readRoles")]
  public IEnumerable<string> ReadRoles { get; set; } = Enumerable.Empty<string>();

  [JsonPropertyName("updateRoles")]
  public IEnumerable<string> UpdateRoles { get; set; } = Enumerable.Empty<string>();

  public FileType(string id, string name)
  {
    Id = id;
    Name = name;
  }
}
