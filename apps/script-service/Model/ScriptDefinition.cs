using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Adsp.Sdk;

//script definitions
namespace Adsp.Platform.ScriptService.Model;

public class ScriptDefinition
{
  [JsonPropertyName("id")]
  [Required]
  public string? Id { get; set; }
  [JsonPropertyName("name")]
  [Required]
  public string? Name { get; set; }
  [JsonPropertyName("description")]
  public string? Description { get; set; }
  [JsonPropertyName("script")]
  [Required]
  public string? Script { get; set; }
  [JsonPropertyName("includeValuesInEvent")]
  public bool? IncludeValuesInEvent { get; set; } = false;
  [JsonPropertyName("useServiceAccount")]
  public bool? UseServiceAccount { get; set; } = false;
  [JsonPropertyName("runnerRoles")]
  public IEnumerable<string> RunnerRoles { get; set; } = Enumerable.Empty<string>();
  [JsonPropertyName("triggerEvents")]
  public IEnumerable<EventIdentity> TriggerEvents { get; set; } = Enumerable.Empty<EventIdentity>();

  internal bool IsAllowedUser(User? user)
  {
    return user != null &&
    (
      user.IsInRole(ServiceRoles.ScriptRunner) ||
      (RunnerRoles.FirstOrDefault(r => user.IsInRole(r)) != null)
    );
  }
}
