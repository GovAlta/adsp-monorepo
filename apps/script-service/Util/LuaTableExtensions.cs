using System.Diagnostics.CodeAnalysis;
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
          if (tableValue.IsArray())
          {
            value = tableValue.ToArray();
          }
          else
          {
            value = tableValue.ToDictionary();
          }
        }
        result.Add(key.ToString()!, value);
      }
    }
    return result;
  }

  [SuppressMessage("Design", "CA1031:Do not catch general exception types", Justification = "Catching general exceptions is necessary here.")]
  private static bool IsArray(this LuaTable item)
  {
    if (item.Keys.Count == 0) return false;
    int expectedKey = 1;
    foreach (var key in item.Keys)
    {
      try
      {
        int index = Convert.ToInt32(key);
        if (index != expectedKey++) return false;
      }
      catch
      {
        return false;
      }
    }
    return true;
  }

  [SuppressMessage("Performance", "CA1851:Possible multiple enumerations of 'IEnumerable' collection", Justification = "Multiple enumerations are intentional and safe here.")]
  private static Array ToArray(this LuaTable table)
  {
    var values = table.Values.Cast<object>();
    Type elementType = values
      .Where(value => value != null)
        .Select(value => value.GetType())
        .FirstOrDefault() ?? typeof(object);
    Array typedArray = Array.CreateInstance(elementType, table.Values.Count);
    int index = 0;
    foreach (var value in values)
    {
      typedArray.SetValue(Convert.ChangeType(value, elementType), index++);
    }
    return typedArray;
  }
}
