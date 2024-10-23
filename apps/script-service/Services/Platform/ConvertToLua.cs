using System.Collections;
using System.Reflection;
using NLua;

namespace Adsp.Platform.ScriptService.Services.Platform;

public static class ConvertToLua
{
  public static LuaTable? ToLuaTable(this FormSubmissionResult submission, Lua lua)
  {
    if (submission == null || lua == null) return null;

    return ConvertObjectToLuaTable(submission, "FormSubmission", lua);
  }

  private static object? ConvertToLuaValue(object? value, string name, Lua lua)
  {
    if (value == null)
    {
      return null;
    }

    // Handle primitive types (strings, numbers, booleans)
    if (value is string || value is int || value is double || value is bool || value is float)
    {
      return value;
    }

    if (value is DateTime dateTime)
    {
      return dateTime.ToString("o");  // Convert DateTime to ISO 8601 format string
    }

    if (value is TimeSpan timeSpan)
    {
      return timeSpan.ToString();  // Convert TimeSpan to string
    }

    if (value is Guid guid)
    {
      return guid.ToString();  // Convert Guid to string
    }

    if (value.GetType().IsEnum)
    {
      return value.ToString();  // Convert Enum to string
    }

    if (value is IDictionary<string, object?>)
    {
      LuaTable dictionary = NewLuaTable(name, lua);
      foreach (DictionaryEntry entry in (IDictionary)value)
      {
        if (entry.Key != null)
        {
          dictionary[entry.Key] = ConvertToLuaValue(entry.Value, entry.Key.ToString(), lua);
        }
      }
      return dictionary;
    }

    if (value is IEnumerable enumerable && !(value is string))
    {
      LuaTable arrayTable = NewLuaTable(name, lua);
      int index = 1; // Lua arrays are 1-indexed
      foreach (var item in enumerable)
      {
        arrayTable[index++] = ConvertToLuaValue(item, $"{name}{index}", lua);
      }
      return arrayTable;
    }

    if (IsCustomObject(value))
    {
      return ConvertObjectToLuaTable(value, name, lua);
    }

    // fallback
    return value.ToString();
  }

  private static bool IsCustomObject(object value)
  {
    // Exclude primitive types and string; consider the rest as custom objects
    return !(value is string || value.GetType().IsPrimitive || value is IEnumerable || value is IDictionary);
  }

  private static LuaTable ConvertObjectToLuaTable(object obj, string name, Lua lua)
  {
    LuaTable luaTable = NewLuaTable(name, lua);

    // Use reflection to get the properties of the object
    PropertyInfo[] properties = obj.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance);

    foreach (var property in properties)
    {
      string propName = property.Name;
      object? propValue = property.GetValue(obj);
      luaTable[propName] = ConvertToLuaValue(propValue, property.Name, lua);
    }

    return luaTable;
  }

  private static LuaTable NewLuaTable(string name, Lua lua)
  {
    LuaTable table = (LuaTable)lua[name];
    if (table == null)
    {
      lua.NewTable(name);
      table = (LuaTable)lua[name];
    }
    return table;
  }

  public static LuaTable? ToLuaTable(this string str, string name, Lua lua)
  {
    if (lua == null) return null;
    var table = NewLuaTable(name, lua);
    table[name] = str;
    return table;
  }

}
