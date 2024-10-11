using System.Collections;
using System.Xml.Serialization;
using System.Diagnostics.CodeAnalysis;
using System.Collections.ObjectModel;

namespace Adsp.Platform.ScriptService.Services;

[XmlRoot("Dictionary")]
[SuppressMessage("Design", "CA2227:Collection properties should be read only", Justification = "Setter is needed to instantiate the object.")]
public class SerializableDictionary<TKey, TValue> : IEnumerable<KeyValuePair<TKey, TValue>>
{
  [XmlArray("Items")]
  [XmlArrayItem("Item")]
  public Collection<KeyValuePair<TKey, TValue>> Items { get; set; }

  public SerializableDictionary()
  {
    Items = new Collection<KeyValuePair<TKey, TValue>>();
  }

  // Implicit conversion to Dictionary<TKey, TValue>
  public IDictionary<TKey, TValue> ToDictionary()
  {
    Dictionary<TKey, TValue> dict = new Dictionary<TKey, TValue>();
    foreach (var kvp in Items)
    {
      dict[kvp.Key] = kvp.Value;
    }
    return dict;
  }

  // Implicit conversion from Dictionary<TKey, TValue>
  public void FromDictionary(IDictionary<TKey, TValue> dictionary)
  {
    if (dictionary != null)
    {
      Items = new Collection<KeyValuePair<TKey, TValue>>();
      foreach (var kvp in dictionary)
      {
        Items.Add(kvp);
      }
    }
  }

  public void Add(TKey key, TValue value)
  {
    Items.Add(new KeyValuePair<TKey, TValue>(key, value));
  }

  public void Add(KeyValuePair<TKey, TValue> item)
  {
    Items.Add(item);
  }

  IEnumerator IEnumerable.GetEnumerator()
  {
    return this.GetEnumerator();
  }

  public IEnumerator<KeyValuePair<TKey, TValue>> GetEnumerator()
  {
    return this.Items.GetEnumerator();
  }
}
