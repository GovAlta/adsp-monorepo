using System.Reflection;
using NLua;

namespace Adsp.Platform.ScriptService.Services;

internal static class LuaExtensions
{
  private static readonly IDictionary<string, MethodInfo> _functionMethods =
    typeof(IScriptFunctions).GetMethods(BindingFlags.Instance | BindingFlags.Public).ToDictionary(method => method.Name);

  public static void RegisterFunctions(this Lua lua, IScriptFunctions target)
  {
    // Declare a global variable 'adsp' to add the functions to.
    lua.DoString("adsp = {}");
    foreach (var functionMethod in _functionMethods)
    {
      lua.RegisterFunction($"adsp.{functionMethod.Key}", target, functionMethod.Value);
    }
  }
}
