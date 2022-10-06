package ca.ab.gov.alberta.adsp.sdk.access;

import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.Nullable;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import ca.ab.gov.alberta.adsp.sdk.AdspRequestContextHolder;
import ca.ab.gov.alberta.adsp.sdk.tenant.Tenant;
import reactor.core.publisher.Mono;

class AccessJwtAuthenticationConverter implements Converter<AbstractAuthenticationToken, AbstractAuthenticationToken> {

  private final boolean isCore;
  private final Tenant tenant;

  public AccessJwtAuthenticationConverter(boolean isCore, Tenant tenant) {
    this.isCore = isCore;
    this.tenant = tenant;
  }

  @Override
  @Nullable
  public AbstractAuthenticationToken convert(AbstractAuthenticationToken source) {
    var target = (JwtAuthenticationToken) source;
    var token = target.getToken();
    var email = token.getClaimAsString("email");
    var id = token.getSubject();
    var name = token.getClaimAsString("preferred_username");

    var user = new AdspUser(this.isCore, this.tenant, id, name, email, target);
    var attributes = RequestContextHolder.getRequestAttributes();
    if (attributes != null) {
      attributes.setAttribute(AdspRequestContextHolder.USER_REQUEST_ATTRIBUTE, user, RequestAttributes.SCOPE_REQUEST);
    }

    return target;
  }

  public Reactive asReactive() {
    return new Reactive(this);
  }

  class Reactive implements Converter<Mono<AbstractAuthenticationToken>, Mono<AbstractAuthenticationToken>> {

    private final AccessJwtAuthenticationConverter converter;

    private Reactive(AccessJwtAuthenticationConverter converter) {
      this.converter = converter;
    }

    @Override
    @Nullable
    public Mono<AbstractAuthenticationToken> convert(Mono<AbstractAuthenticationToken> source) {
      return source.map(this.converter::convert);
    }
  }
}
