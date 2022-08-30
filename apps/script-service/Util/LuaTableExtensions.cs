using NLua;

namespace Adsp.Platform.ScriptService.Services.Util;
internal static class LuaTableExtensions
{
  public static IDictionary<string, object> ToDictionary(this LuaTable? table)
  {
    var result = new Dictionary<string, object>();
    if (table != null)
    {
      foreach (var key in table.Keys)
      {
        var value = table[key];
        if (value is LuaTable tableValue)
        {
          value = tableValue.ToDictionary();
        }
        result.Add(key.ToString()!, value);
      }
    }
    return result;
  }
}
