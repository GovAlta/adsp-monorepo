package ca.ab.gov.alberta.adsp.sdk.access;

import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.Nullable;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import reactor.core.publisher.Mono;

class AccessJwtAuthenticationConverter implements Converter<AbstractAuthenticationToken, AbstractAuthenticationToken> {

  private final AccessIssuer issuer;

  public AccessJwtAuthenticationConverter(AccessIssuer issuer) {
    this.issuer = issuer;
  }

  @Override
  @Nullable
  public AbstractAuthenticationToken convert(AbstractAuthenticationToken source) {
    var target = (JwtAuthenticationToken) source;
    var token = target.getToken();
    var email = token.getClaimAsString("email");
    var id = token.getSubject();
    var name = token.getClaimAsString("preferred_username");

    var user = new AdspUser(this.issuer, id, name, email, target);
    return new AccessJwtAuthenticationToken((JwtAuthenticationToken) source, user);
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
