import { IdentifiersOptions, NameInput, NameOptions, NameToken } from './types';
export declare class Identifiers {
    #private;
    ID_COLUMN: "id";
    ORDER_COLUMN: "order";
    FIELD_COLUMN: "field";
    HASH_LENGTH: 5;
    HASH_SEPARATOR: "";
    IDENTIFIER_SEPARATOR: "_";
    MIN_TOKEN_LENGTH: 3;
    constructor(options: {
        maxLength: number;
    });
    get replacementMap(): {
        links: string;
        order_inv_fk: string;
        order: string;
        morphs: string;
        index: string;
        inv_fk: string;
        order_fk: string;
        id_column_index: string;
        order_index: string;
        unique: string;
        primary: string;
    };
    get options(): IdentifiersOptions;
    mapshortNames: (name: string) => string | undefined;
    /**
     * TODO: we should be requiring snake_case inputs for all names here, but we
     * aren't and it will require some refactoring to make it work. Currently if
     * we get names 'myModel' and 'my_model' they would be converted to the same
     * final string my_model which generally works but is not entirely safe
     * */
    getName: (names: NameInput, options?: NameOptions) => string;
    /**
     * TABLES
     */
    getTableName: (name: string, options?: NameOptions) => string;
    getJoinTableName: (collectionName: string, attributeName: string, options?: NameOptions) => string;
    getMorphTableName: (collectionName: string, attributeName: string, options?: NameOptions) => string;
    /**
     * COLUMNS
     */
    getColumnName: (attributeName: string, options?: NameOptions) => string;
    getJoinColumnAttributeIdName: (attributeName: string, options?: NameOptions) => string;
    getInverseJoinColumnAttributeIdName: (attributeName: string, options?: NameOptions) => string;
    getOrderColumnName: (singularName: string, options?: NameOptions) => string;
    getInverseOrderColumnName: (singularName: string, options?: NameOptions) => string;
    /**
     * Morph Join Tables
     */
    getMorphColumnJoinTableIdName: (singularName: string, options?: NameOptions) => string;
    getMorphColumnAttributeIdName: (attributeName: string, options?: NameOptions) => string;
    getMorphColumnTypeName: (attributeName: string, options?: NameOptions) => string;
    /**
     * INDEXES
     * Note that these methods are generally used to reference full table names + attribute(s), which
     * may already be shortened strings rather than individual parts.
     * That is fine and expected to compress the previously incompressible parts of those strings,
     * because in these cases the relevant information is the table name and we can't really do
     * any better; shortening the individual parts again might make it even more confusing.
     *
     * So for example, the fk for the table `mytable_myattr4567d_localizations` will become
     * mytable_myattr4567d_loc63bf2_fk
     */
    getIndexName: (names: NameInput, options?: NameOptions) => string;
    getFkIndexName: (names: NameInput, options?: NameOptions) => string;
    getUniqueIndexName: (names: NameInput, options?: NameOptions) => string;
    getPrimaryIndexName: (names: NameInput, options?: NameOptions) => string;
    getInverseFkIndexName: (names: NameInput, options?: NameOptions) => string;
    getOrderFkIndexName: (names: NameInput, options?: NameOptions) => string;
    getOrderInverseFkIndexName: (names: NameInput, options?: NameOptions) => string;
    getIdColumnIndexName: (names: NameInput, options?: NameOptions) => string;
    getOrderIndexName: (names: NameInput, options?: NameOptions) => string;
    /**
     * Generates a string with a max length, appending a hash at the end if necessary to keep it unique
     *
     * @example
     * // if we have strings such as "longstring1" and "longstring2" with a max length of 9,
     * // we don't want to end up with "longstrin" and "longstrin"
     * // we want something such as    "longs0b23" and "longs953f"
     * const token1 = generateToken("longstring1", 9); // "longs0b23"
     * const token2 = generateToken("longstring2", 9); // "longs953f"
     *
     * @param name - The base name
     * @param len - The desired length of the token.
     * @returns The generated token with hash.
     * @throws Error if the length is not a positive integer, or if the length is too short for the token.
     * @internal
     */
    getShortenedName: (name: string, len: number) => string;
    /**
     * Constructs a name from an array of name tokens within a specified maximum length. It ensures the final name does not exceed
     * this limit by selectively compressing tokens marked as compressible. If the name exceeds the maximum length and cannot be
     * compressed sufficiently, an error is thrown. This function supports dynamic adjustment of token lengths to fit within the
     * maxLength constraint (that is, it will always make use of all available space), while also ensuring the preservation of
     * incompressible tokens.
     * @internal
     */
    getNameFromTokens: (nameTokens: NameToken[]) => string;
    nameMap: Map<string, string>;
    getUnshortenedName: (shortName: string) => string;
    setUnshortenedName: (shortName: string, fullName: string) => void;
    serializeKey: (shortName: string) => string;
}
export declare const identifiers: Identifiers;
//# sourceMappingURL=index.d.ts.map