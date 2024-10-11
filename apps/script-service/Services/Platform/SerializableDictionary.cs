using System;
using System.Collections.Generic;
using System.Xml;
using System.Xml.Schema;
using System.Xml.Serialization;

namespace Adsp.Platform.ScriptService.Services;
[XmlRoot("Dictionary")]
public class SerializableDictionary<TKey, TValue> : Dictionary<TKey, TValue>, IXmlSerializable
{
  public XmlSchema GetSchema() => null;

  // Custom XML read logic
  public void ReadXml(XmlReader reader)
  {
    if (reader == null || reader.IsEmptyElement) return;

    reader.Read(); // Move past the <Dictionary> tag
    while (reader.NodeType != XmlNodeType.EndElement)
    {
      reader.ReadStartElement("Item");

      TKey key = (TKey)new XmlSerializer(typeof(TKey)).Deserialize(reader);
      TValue value = (TValue)new XmlSerializer(typeof(TValue)).Deserialize(reader);

      this.Add(key, value);
      reader.ReadEndElement(); // End of <Item>
    }
    reader.ReadEndElement(); // End of <Dictionary>
  }

  // Custom XML write logic
  public void WriteXml(XmlWriter writer)
  {
    if (writer != null) foreach (var key in Keys)
      {
        writer.WriteStartElement("Item");

        // Serialize the Key
        writer.WriteStartElement("Key");
        new XmlSerializer(typeof(TKey)).Serialize(writer, key);
        writer.WriteEndElement(); // End of <Key>

        // Serialize the Value
        writer.WriteStartElement("Value");
        new XmlSerializer(typeof(TValue)).Serialize(writer, this[key]);
        writer.WriteEndElement(); // End of <Value>

        writer.WriteEndElement(); // End of <Item>
      }
  }
}
