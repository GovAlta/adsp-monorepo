using System.Xml;
using System.Xml.Schema;
using System.Xml.Serialization;
using System.Diagnostics.CodeAnalysis;

namespace Adsp.Platform.ScriptService.Services;
[XmlRoot("Dictionary")]
public class SerializableDictionary<TKey, TValue> : Dictionary<TKey, TValue>, IXmlSerializable
{
  public XmlSchema GetSchema() => null;

  public void ReadXml(XmlReader reader)
  {
    if (reader == null || reader.IsEmptyElement) return;

    XmlReaderSettings settings = new XmlReaderSettings
    {
      DtdProcessing = DtdProcessing.Parse,
      XmlResolver = null
    };
#pragma warning disable CA2000
    XmlReader customReader = XmlReader.Create(reader, settings);
#pragma warning restore CA2000

    customReader.Read(); // Move past the <Dictionary> tag
    while (customReader.NodeType != XmlNodeType.EndElement)
    {
      customReader.ReadStartElement("Item");

      TKey key = (TKey)new XmlSerializer(typeof(TKey)).Deserialize(customReader);
      TValue value = (TValue)new XmlSerializer(typeof(TValue)).Deserialize(customReader);

      this.Add(key, value);
      reader.ReadEndElement();
    }
    reader.ReadEndElement();
  }

  // Custom XML write logic
  public void WriteXml(XmlWriter writer)
  {
    if (writer != null) foreach (var key in Keys)
      {
        writer.WriteStartElement("Item");

        writer.WriteStartElement("Key");
        new XmlSerializer(typeof(TKey)).Serialize(writer, key);
        writer.WriteEndElement();

        // Serialize the Value
        writer.WriteStartElement("Value");
        new XmlSerializer(typeof(TValue)).Serialize(writer, this[key]);
        writer.WriteEndElement();

        writer.WriteEndElement();
      }
  }
}
