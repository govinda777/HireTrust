export abstract class Entity<T> {
  protected readonly _id: string;
  public readonly props: T;

  constructor(props: T, id?: string) {
    this._id = id || "unique-id"; // Replace with actual UUID generator
    this.props = props;
  }

  get id(): string {
    return this._id;
  }
}
