using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Adsp.Sdk;

namespace Adsp.Platform.ScriptService.Model;
public class ScriptDefinition
{
  [JsonPropertyName("id")]
  [Required]
  public string? Id { get; set; }
  [JsonPropertyName("script")]
  [Required]
  public string? Script { get; set; }
  [JsonPropertyName("includeValuesInEvent")]
  public bool? IncludeValuesInEvent { get; set; } = false;
  [JsonPropertyName("runnerRoles")]
  public IEnumerable<string> RunnerRoles { get; set; } = Enumerable.Empty<string>();

  internal bool IsAllowedUser(User? user)
  {
    return user != null &&
    (
      user.IsInRole(ServiceRoles.ScriptRunner) ||
      (RunnerRoles.FirstOrDefault(r => user.IsInRole(r)) != null)
    );
  }
}
