package ca.ab.gov.alberta.adsp.sdk.access;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.text.ParseException;

import org.apache.commons.lang3.StringUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

import com.nimbusds.jose.util.JSONObjectUtils;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.tenant.Tenant;

@ExtendWith(MockitoExtension.class)
class AccessJwtGrantedAuthoritiesConverterTests {

  @Test
  public void canConvert(@Mock Jwt token) throws ParseException {
    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var tenant = new Tenant();
    tenant.setId(AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo"));
    tenant.setName("Demo");
    tenant.setRealm("demo");
    var issuer = new AccessIssuer(false, tenant);

    var realmAccess = JSONObjectUtils.parse("{\"roles\":[\"test-realm-role\"]}");
    when(token.getClaim("realm_access")).thenReturn(realmAccess);
    var resourceAccess = JSONObjectUtils
        .parse(
            "{\"urn:ads:platform:test-service\":{\"roles\":[\"test-client-role\"]},\"urn:ads:platform:demo-service\":{\"roles\":[\"test-client-role\"]}}");
    when(token.getClaim("resource_access")).thenReturn(resourceAccess);

    var converter = new AccessJwtGrantedAuthoritiesConverter(serviceId, issuer);
    var result = converter.convert(token);
    assertNotNull(result);
    assertTrue(result.stream().anyMatch(auth -> StringUtils.equals(auth.getAuthority(), "ADSP_TENANT_demo")));
    assertTrue(result.stream().anyMatch(auth -> StringUtils.equals(auth.getAuthority(), "ROLE_test-realm-role")));
    assertTrue(result.stream().anyMatch(
        auth -> StringUtils.equals(auth.getAuthority(), "ROLE_urn:ads:platform:demo-service:test-client-role")));
  }

  @Test
  public void canConvertCoreAuthority(@Mock Jwt token) throws ParseException {
    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var issuer = new AccessIssuer(true, null);

    var realmAccess = JSONObjectUtils.parse("{\"roles\":[]}");
    when(token.getClaim("realm_access")).thenReturn(realmAccess);
    var resourceAccess = JSONObjectUtils.parse("{}");
    when(token.getClaim("resource_access")).thenReturn(resourceAccess);

    var converter = new AccessJwtGrantedAuthoritiesConverter(serviceId, issuer);
    var result = converter.convert(token);
    assertNotNull(result);
    assertTrue(result.stream().anyMatch(auth -> StringUtils.equals(auth.getAuthority(), "ADSP_CROSS_TENANT")));
  }

  @Test
  public void canReactiveConvert(@Mock Jwt token) throws ParseException {
    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var tenant = new Tenant();
    tenant.setId(AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo"));
    tenant.setName("Demo");
    tenant.setRealm("demo");
    var issuer = new AccessIssuer(false, tenant);

    var realmAccess = JSONObjectUtils.parse("{\"roles\":[\"test-realm-role\"]}");
    when(token.getClaim("realm_access")).thenReturn(realmAccess);
    var resourceAccess = JSONObjectUtils
        .parse(
            "{\"urn:ads:platform:test-service\":{\"roles\":[\"test-client-role\"]},\"urn:ads:platform:demo-service\":{\"roles\":[\"test-client-role\"]}}");
    when(token.getClaim("resource_access")).thenReturn(resourceAccess);

    var converter = new AccessJwtGrantedAuthoritiesConverter(serviceId, issuer);
    var result = converter.asReactive().convert(token);
    assertNotNull(result);
    assertTrue(result.toStream().anyMatch(auth -> StringUtils.equals(auth.getAuthority(), "ADSP_TENANT_demo")));
    assertTrue(result.toStream().anyMatch(auth -> StringUtils.equals(auth.getAuthority(), "ROLE_test-realm-role")));
    assertTrue(result.toStream().anyMatch(
        auth -> StringUtils.equals(auth.getAuthority(), "ROLE_urn:ads:platform:demo-service:test-client-role")));
  }
}
