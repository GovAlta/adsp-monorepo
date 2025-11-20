using NLua;
using Adsp.Platform.ScriptService.Services.Platform;
using System.Globalization;

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

  private static bool IsArray(this LuaTable item)
  {
    if (item.Keys.Count == 0) return false;
    int expectedKey = 1;
    foreach (var key in item.Keys)
    {
      try
      {
        int index = Convert.ToInt32(key, CultureInfo.InvariantCulture);
        if (index != expectedKey++) return false;
      }
      catch
      {
        return false;
      }
    }
    return true;
  }

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
      typedArray.SetValue(Convert.ChangeType(value, elementType, CultureInfo.InvariantCulture), index++);
    }
    return typedArray;
  }

  const string CONTEXT_KEY = "context";
  const string VALUE_KEY = "value";
  const string CORRELATION_ID_KEY = "correlationId";

  public static ValueCreateRequest ToRequest(this LuaTable tableValue, string @namespace, string name)
  {
    return tableValue.ToDictionary().ToRequest(@namespace, name);
  }

  public static ValueCreateRequest ToRequest(this IDictionary<string, object> dataValue, string @namespace, string name)
  {
    Dictionary<string, object?>? value = null;
    Dictionary<string, object?>? context = null;
    string? correlationId;

    if (dataValue != null && !dataValue.TryGetValue(VALUE_KEY, out _))
    {
      throw new ArgumentException("value is required.");
    }

    if (dataValue?[VALUE_KEY].GetType() == typeof(Dictionary<string, object>))
    {
      //     var rawValue = Deserialize<>()
      value = dataValue[VALUE_KEY] as Dictionary<string, object?>;
    }
    if (dataValue != null && dataValue.TryGetValue(VALUE_KEY, out _) && dataValue[CONTEXT_KEY].GetType() == typeof(Dictionary<string, object>))
    {
      context = dataValue[CONTEXT_KEY] as Dictionary<string, object?>;
    }

    correlationId = dataValue?[CORRELATION_ID_KEY]?.ToString();

    return new ValueCreateRequest()
    {
      Namespace = @namespace,
      Name = name,
      Timestamp = DateTime.Now,
      Value = value,
      Context = context,
      CorrelationId = correlationId
    };
  }
}
