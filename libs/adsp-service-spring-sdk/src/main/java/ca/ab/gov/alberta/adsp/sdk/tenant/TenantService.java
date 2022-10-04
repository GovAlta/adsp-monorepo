package ca.ab.gov.alberta.adsp.sdk.tenant;

import java.util.List;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import reactor.core.publisher.Mono;

public interface TenantService {
  Mono<List<Tenant>> getTenants();
  Mono<Tenant> getTenant(AdspId tenantId);
}
