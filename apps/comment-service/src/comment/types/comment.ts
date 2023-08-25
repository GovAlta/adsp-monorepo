export interface Comment {
  id: number;
  title: string;
  content: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdOn: Date;
  lastUpdatedBy: {
    id: string;
    name: string;
  };
  lastUpdatedOn: Date;
}

export interface CommentCriteria {
  titleLike?: string;
  contentLike?: string;
  titleOrContentLike?: string;
}
