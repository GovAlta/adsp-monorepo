using Newtonsoft.Json.Linq;

namespace Adsp.Platform.ScriptService.Services.Util;

internal static class JTokenExtensions
{

  public static IDictionary<string, T>? ToDictionary<T>(this JToken token)
  {
    if (token != null && token is JObject item)
    {
      return (Dictionary<string, T>?)DictionaryHelper<T>(item);
    }
    return null;
  }

  public static object? DictionaryHelper<T>(JToken token)
  {
    if (token is JObject jObject)
    {
      var result = new Dictionary<string, T?>();
      foreach (JProperty property in jObject.Properties())
      {
        result[property.Name] = (T?)DictionaryHelper<T>(property.Value);
      }
      return result;
    }
    else if (token is JArray jArray)
    {
      var items = new List<object>();
      foreach (JToken item in jArray)
      {
        var converted = DictionaryHelper<T>(item);
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
