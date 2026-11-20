import { AdspId } from '@abgov/adsp-service-sdk';
import { GraphFileClient, GraphTokenProvider } from './graph';
import { SharePointConnection } from './types';
import { withToken } from './withToken';

// A library's drive ID doesn't change, so it is looked up once; a deleted library's entry is cleared with evict.
export class LibraryDriveResolver {
  private cache = new Map<string, string>();

  constructor(
    private tokens: GraphTokenProvider,
    private files: GraphFileClient,
  ) {}

  // The site is part of the key so a connection moved to another site never reuses the old site's drive.
  private cacheKey(tenantId: AdspId, { id, siteId }: SharePointConnection, libraryId: string): string {
    return `${tenantId.toString()}|${id}|${siteId}|${libraryId}`;
  }

  // Undefined means the site's default document library.
  async driveFor(
    tenantId: AdspId,
    connection: SharePointConnection,
    libraryId: string | undefined,
    { fresh = false }: { fresh?: boolean } = {},
  ): Promise<string | undefined> {
    if (!libraryId) {
      return undefined;
    }
    const key = this.cacheKey(tenantId, connection, libraryId);
    const cached = this.cache.get(key);
    if (cached && !fresh) {
      return cached;
    }
    const driveId = await withToken(this.tokens, tenantId, connection, (token) =>
      this.files.getLibraryDriveId(token, connection.siteId, libraryId),
    );
    this.cache.set(key, driveId);
    return driveId;
  }

  evict(tenantId: AdspId, connection: SharePointConnection, libraryId: string): void {
    this.cache.delete(this.cacheKey(tenantId, connection, libraryId));
  }
}
