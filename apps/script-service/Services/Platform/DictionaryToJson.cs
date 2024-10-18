using Newtonsoft.Json.Linq;

namespace Adsp.Platform.ScriptService.Services.Platform;

public static class DictionaryToJson
{
    public static IDictionary<string, object?> Fix(IDictionary<string, object?> dict)
    {
        var result = new Dictionary<string, object?>();

        foreach (var kvp in dict)
        {
            if (kvp.Value is JObject jObject)
            {
                // Recursively convert JObject to Dictionary
                result[kvp.Key] = Fix(jObject.ToObject<Dictionary<string, object?>>());
            }
            else if (kvp.Value is JArray jArray)
            {
                // Recursively convert JArray to List<object>
                result[kvp.Key] = ConvertToList(jArray);
            }
            else
            {
                result[kvp.Key] = kvp.Value;
            }
        }

        return result;
    }

    // Recursively convert JArray to List<object>
    public static List<object> ConvertToList(JArray items)
    {
        var result = new List<object>();
        foreach (var item in items)
        {
            if (item is JObject jObject)
            {
                result.Add(Fix(jObject.ToObject<Dictionary<string, object?>>()));
            }
            else if (item is JArray jArray)
            {
                result.Add(ConvertToList(jArray));
            }
            else
            {
                result.Add(item);
            }
        }

        return result;
    }

}
