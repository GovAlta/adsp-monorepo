using Newtonsoft.Json.Linq;

namespace Adsp.Platform.ScriptService.Services.Util;
internal static class JTokenExtensions
{
  public static Dictionary<string, object>? ToDictionary(this JToken token)
  {
    if (token != null && token is JObject item)
    {
      return (Dictionary<string, object>?)DictionaryHelper(item);
    }
    return null;
  }

  public static object? DictionaryHelper(JToken token)
  {
    if (token is JObject jObject)
    {
      var result = new Dictionary<string, object?>();
      foreach (var property in jObject.Properties())
      {
        result[property.Name] = DictionaryHelper(property.Value);
      }
      return result;
    }
    else if (token is JArray jArray)
    {
      var items = new List<object>();
      foreach (var item in jArray)
      {
        var converted = DictionaryHelper(item);
        if (converted is not null)
        {
          items.Add(converted);
        }
      }
      return items;
    }
    else if (token is JValue jValue)
    {
      return jValue.Value;
    }

    return null;
  }
}
