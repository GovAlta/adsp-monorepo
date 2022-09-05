using Adsp.Platform.ScriptService.Model;
using Adsp.Sdk;

namespace Adsp.Platform.ScriptService;
internal class ScriptConfiguration
{
  private readonly IDictionary<string, ScriptDefinition> _definitions = new Dictionary<string, ScriptDefinition>();
  private readonly IDictionary<string, (EventIdentity, ScriptDefinition)> _definitionsByEvent = new Dictionary<string, (EventIdentity, ScriptDefinition)>();

  public IDictionary<string, ScriptDefinition> Definitions
  {
    get { return _definitions; }
  }

  public ScriptConfiguration(object? tenant, object? core)
  {
    if (tenant is IDictionary<string, ScriptDefinition> tenantDefinitions)
    {
      foreach (var entry in tenantDefinitions)
      {
        AddDefinition(entry.Key, entry.Value);
      }
    }

    if (core is IDictionary<string, ScriptDefinition> coreDefinitions)
    {
      foreach (var entry in coreDefinitions)
      {
        AddDefinition(entry.Key, entry.Value);
      }
    }
  }

  private void AddDefinition(string key, ScriptDefinition definition)
  {
    Definitions[key] = definition;
    foreach (var triggerEvent in definition.TriggerEvents)
    {
      _definitionsByEvent.Add($"{triggerEvent.Namespace}:{triggerEvent.Name}", (triggerEvent, definition));
    }
  }

  public bool TryGetTriggeredScript(string @namespace, string name, out (EventIdentity, ScriptDefinition) definition)
  {
    return _definitionsByEvent.TryGetValue($"{@namespace}:{name}", out definition);
  }
}
