package ca.ab.gov.alberta.adsp.sdk.access;

import java.util.Collection;
import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import com.nimbusds.jose.shaded.json.JSONArray;
import com.nimbusds.jose.shaded.json.JSONObject;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import reactor.core.publisher.Flux;

class AccessJwtGrantedAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
  private static final String REALM_ACCESS_ROLES_CLAIM = "realm_access";
  private static final String RESOURCE_ACCESS_CLAIM = "resource_access";
  public static final String ROLE_AUTHORITY_PREFIX = "ROLE_";

  private final JwtGrantedAuthoritiesConverter jwtConverter = new JwtGrantedAuthoritiesConverter();
  private final String serviceId;

  public AccessJwtGrantedAuthoritiesConverter(AdspId serviceId) {
    this.serviceId = serviceId.toString();
  }

  @Override
  @Nullable
  public Collection<GrantedAuthority> convert(Jwt source) {
    Collection<GrantedAuthority> authorities = this.jwtConverter.convert(source);

    JSONObject realmAccess = source.getClaim(REALM_ACCESS_ROLES_CLAIM);
    var realmRoles = (JSONArray) realmAccess.get("roles");
    if (realmRoles != null) {
      realmRoles.forEach(role -> authorities.add(new SimpleGrantedAuthority(ROLE_AUTHORITY_PREFIX + role)));
    }

    JSONObject clientAccesses = source.getClaim(RESOURCE_ACCESS_CLAIM);
    var keys = clientAccesses.keySet();
    for (var key : keys) {
      var clientAccess = (JSONObject) clientAccesses.get(key);
      var clientRoles = (JSONArray) clientAccess.get("roles");
      if (clientRoles != null) {
        clientRoles.forEach(role -> authorities.add(
            new SimpleGrantedAuthority(ROLE_AUTHORITY_PREFIX + (key.equals(this.serviceId) ? role : (key + ":" + role)))));
      }
    }

    return authorities;
  }

  public Reactive asReactive() {
    return new Reactive(this);
  }

  class Reactive implements Converter<Jwt, Flux<GrantedAuthority>> {

    private final AccessJwtGrantedAuthoritiesConverter converter;

    private Reactive(AccessJwtGrantedAuthoritiesConverter converter) {
      this.converter = converter;
    }

    @Override
    @Nullable
    public Flux<GrantedAuthority> convert(Jwt source) {
      return Flux.fromIterable(this.converter.convert(source));
    }
  }
}
