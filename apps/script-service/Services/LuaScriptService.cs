using System.Diagnostics.CodeAnalysis;
using System.Text;
using Adsp.Platform.ScriptService.Events;
using Adsp.Platform.ScriptService.Model;
using Adsp.Sdk;
using Adsp.Sdk.Errors;
using NLua;
using NLua.Exceptions;


namespace Adsp.Platform.ScriptService.Services;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
[SuppressMessage("Usage", "CA1031: Do not catch general exception types", Justification = "WIP: script error handling")]
internal class LuaScriptService : ILuaScriptService
{
  private readonly ILogger<LuaScriptService> _logger;
  private readonly IServiceDirectory _directory;
  private readonly IEventService _eventService;

  public LuaScriptService(ILogger<LuaScriptService> logger, IServiceDirectory directory, IEventService eventService)
  {
    _logger = logger;
    _directory = directory;
    _eventService = eventService;
  }
  public IEnumerable<object> TestScript(
    IDictionary<string, object?> inputs,
    string script,
    AdspId tenantId
  )
  {

    _logger.LogDebug("Testing script for tenant {TenantId}...", tenantId);
    try
    {
      using var lua = new Lua();
      // TODO: create sub for RegisterFunctions
      lua.RegisterFunctions(new ScriptFunctions(tenantId, _directory, () => Task.FromResult("mock token used in test script")));
      lua["script"] = script;
      lua["inputs"] = inputs;

      lua.State.Encoding = Encoding.UTF8;
      var outputs = lua.DoString(@"
        import = function () end
        local sandbox = require 'scripts/sandbox'
        return sandbox.run(script, { env = { inputs = inputs, adsp = adsp } })
      ");
      return outputs;
    }
    catch (LuaScriptException e)
    {
      _logger.LogError(e, "Lua error encountered testing script for tenant {TenantId}", tenantId);
      throw new ScriptRunException(e.Message, e);
    }
  }


  public async Task<IEnumerable<object>> RunScript(
    Guid jobId,
    AdspId tenantId,
    ScriptDefinition definition,
    IDictionary<string, object?> inputs,
    Func<Task<string>> getToken,
    string? correlationId = null,
    UserIdentifier? user = null,
    EventIdentity? trigger = null
  )
  {
    _logger.LogDebug("Running script definition {Id} for tenant {TenantId}...", definition.Id, tenantId);

    try
    {
      // Use the jobId as the correlationId if no value is specified.
      if (String.IsNullOrEmpty(correlationId))
      {
        correlationId = jobId.ToString();
      }

      using var lua = new Lua();
      lua.State.Encoding = Encoding.UTF8;
      lua.RegisterFunctions(new ScriptFunctions(tenantId, _directory, getToken));

      lua["script"] = definition.Script;
      lua["inputs"] = inputs;

      var outputs = lua.DoString(@"
        import = function () end

        local sandbox = require 'scripts/sandbox'
        return sandbox.run(script, { env = { inputs = inputs, adsp = adsp } })
      ");

      var eventPayload = new ScriptExecuted
      {
        JobId = jobId,
        Definition = definition,
        ExecutedBy = user,
        TriggeredBy = trigger
      };

      if (definition.IncludeValuesInEvent == true)
      {
        eventPayload.Inputs = inputs;
        eventPayload.Outputs = outputs;
      }

      await _eventService.Send(
        new DomainEvent<ScriptExecuted>(
          ScriptExecuted.EventName,
          DateTime.Now,
          eventPayload,
          correlationId,
          new Dictionary<string, object> { { "definitionId", definition.Id! } }
        ),
        tenantId
      );

      return outputs;
    }
    catch (LuaScriptException e)
    {
      _logger.LogError(e, "Lua error encountered running script {Id}.", definition.Id);

      var eventPayload = new ScriptExecutionFailed
      {
        JobId = jobId,
        Definition = definition,
        Error = e.Message,
        ExecutedBy = user,
        TriggeredBy = trigger
      };
      if (definition.IncludeValuesInEvent == true)
      {
        eventPayload.Inputs = inputs;
      }

      await _eventService.Send(new DomainEvent<ScriptExecutionFailed>(
          ScriptExecutionFailed.EventName,
          DateTime.Now,
          eventPayload,
          correlationId,
          new Dictionary<string, object> { { "definitionId", definition.Id! } }
        ),
        tenantId
      );

      throw new ScriptRunException(e.Message, e);
    }
    catch (Exception e)
    {
      _logger.LogError(e, "Unrecognized error encountered running script {Id}.", definition.Id);
      throw new InternalErrorException("Unrecognized error encountered running script.", e);
    }
  }
}
