package ca.ab.gov.alberta.adsp.sdk;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class AdspIdTests {

  @Test
  public void canFailForInvalidNID() {
    assertThrows(IllegalArgumentException.class, () -> AdspId.parse("urn:wrong"));
  }

  @Test
  public void canFailForIncomplete() {
    assertThrows(IllegalArgumentException.class, () -> AdspId.parse("urn:ads:"));
  }

  @Test
  public void canParseNamespace() {
    var id = AdspId.parse("urn:ads:my-namespace");
    assertEquals(id.getType(), ResourceType.Namespace);
    assertEquals(id.getNamespace(), "my-namespace");
  }

  @Test
  public void canParseService() {
    var id = AdspId.parse("urn:ads:my-namespace:my-service");
    assertEquals(id.getType(), ResourceType.Service);
    assertEquals(id.getNamespace(), "my-namespace");
    assertEquals(id.getService(), "my-service");
  }

  @Test
  public void canParseApi() {
    var id = AdspId.parse("urn:ads:my-namespace:my-service:v1");
    assertEquals(id.getType(), ResourceType.Api);
    assertEquals(id.getNamespace(), "my-namespace");
    assertEquals(id.getService(), "my-service");
    assertEquals(id.getApi(), "v1");
  }

  @Test
  public void canParseResource() {
    var id = AdspId.parse("urn:ads:my-namespace:my-service:v1:/resources/my-resource");
    assertEquals(id.getType(), ResourceType.Resource);
    assertEquals(id.getNamespace(), "my-namespace");
    assertEquals(id.getService(), "my-service");
    assertEquals(id.getApi(), "v1");
    assertEquals(id.getResource(), "/resources/my-resource");
  }

  @Test
  public void canConvertToString() {
    var urn = AdspId.parse("urn:ads:my-namespace:my-service").toString();
    assertEquals(urn, "urn:ads:my-namespace:my-service");
  }

  @Test
  public void canCreateHashCode() {
    var x = AdspId.parse("urn:ads:my-namespace:my-service:v1:/resources/my-resource");
    var y = AdspId.parse("urn:ads:my-namespace:my-service:v1:/resources/my-resource");
    var z = AdspId.parse("urn:ads:my-namespace:my-service:v1:/resources/my-resource-2");

    assertEquals(x.hashCode(), y.hashCode());
    assertNotEquals(x.hashCode(), z.hashCode());
  }

  @Test
  public void canCompareEquality() {
    var x = AdspId.parse("urn:ads:my-namespace:my-service:v1:/resources/my-resource");
    var y = AdspId.parse("urn:ads:my-namespace:my-service:v1:/resources/my-resource");
    var z = AdspId.parse("urn:ads:my-namespace:my-service:v1:/resources/my-resource-2");

    assertEquals(x, y);
    assertNotEquals(x, z);
    assertNotEquals(x, "urn:ads:my-namespace:my-service:v1:/resources/my-resource");
  }
}
