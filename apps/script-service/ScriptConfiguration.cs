using Adsp.Platform.ScriptService.Model;
using Adsp.Sdk;
using Adsp.Sdk.Amqp;
using Adsp.Sdk.Events;

namespace Adsp.Platform.ScriptService;

internal sealed class ScriptConfiguration
{
  private readonly IDictionary<string, ScriptDefinition> _definitions = new Dictionary<string, ScriptDefinition>();
  private readonly IDictionary<string, IList<(EventIdentity, ScriptDefinition)>> _definitionsByEvent = new Dictionary<string, IList<(EventIdentity, ScriptDefinition)>>();

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
      var qualifiedName = $"{triggerEvent.Namespace}:{triggerEvent.Name}";
      if (!_definitionsByEvent.TryGetValue(qualifiedName, out IList<(EventIdentity, ScriptDefinition)>? definitions))
      {
        definitions = new List<(EventIdentity, ScriptDefinition)>();
        _definitionsByEvent[qualifiedName] = definitions;
      }

      definitions.Add((triggerEvent, definition));
    }
  }

  public IEnumerable<ScriptDefinition> GetTriggeredScripts<TPayload>(FullDomainEvent<TPayload> domainEvent) where TPayload : class
  {
    IEnumerable<ScriptDefinition> definitions;
    if (_definitionsByEvent.TryGetValue($"{domainEvent.Namespace}:{domainEvent.Name}", out IList<(EventIdentity, ScriptDefinition)>? definitionsWithEvent))
    {
      definitions = definitionsWithEvent.Where(item => item.Item1.IsMatch(domainEvent)).Select(item => item.Item2);
    }
    else
    {
      definitions = Enumerable.Empty<ScriptDefinition>();
    }

    return definitions;
  }
}
