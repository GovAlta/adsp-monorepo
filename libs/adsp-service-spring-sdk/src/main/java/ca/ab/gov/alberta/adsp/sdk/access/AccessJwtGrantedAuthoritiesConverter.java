package ca.ab.gov.alberta.adsp.sdk.access;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import reactor.core.publisher.Flux;

class AccessJwtGrantedAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
  private static final String REALM_ACCESS_ROLES_CLAIM = "realm_access";
  private static final String RESOURCE_ACCESS_CLAIM = "resource_access";
  public static final String ROLE_AUTHORITY_PREFIX = "ROLE_";

  private final JwtGrantedAuthoritiesConverter jwtConverter = new JwtGrantedAuthoritiesConverter();
  private final String serviceId;
  private final AccessIssuer issuer;

  public AccessJwtGrantedAuthoritiesConverter(AdspId serviceId, AccessIssuer issuer) {
    this.serviceId = serviceId.toString();
    this.issuer = issuer;
  }

  @Override
  @Nullable
  public Collection<GrantedAuthority> convert(Jwt source) {
    Collection<GrantedAuthority> authorities = this.jwtConverter.convert(source);
    authorities.add((new AccessTenancyAuthority(this.issuer)));
    
    Map<String, List<String>> realmAccess = source.getClaim(REALM_ACCESS_ROLES_CLAIM);
    if (realmAccess != null) {
    	List<String> realmRoles = realmAccess.get("roles");
	    if (realmRoles != null) {
	    	realmRoles.forEach(role -> authorities.add(new SimpleGrantedAuthority(ROLE_AUTHORITY_PREFIX + role)));
	    }
    }
    
    Map<String, Map<String, List<String>>> clientAccesses = source.getClaim(RESOURCE_ACCESS_CLAIM);
    if (clientAccesses != null) {
    	var keys = clientAccesses.keySet();
    	for (var key : keys) {
    		Map<String, List<String>> clientAccess = clientAccesses.get(key);
    		List<String> clientRoles = clientAccess.get("roles");
    		
    		if (clientRoles != null) {
    			clientRoles.forEach(role -> authorities.add(
    					new SimpleGrantedAuthority(
    							ROLE_AUTHORITY_PREFIX + (key.equals(this.serviceId) ? role : (key + ":" + role)))));
    		}
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
