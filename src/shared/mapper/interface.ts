export interface IMapper<DomainModel, PersistenceModel> {
  toPersistence(model: DomainModel): Partial<PersistenceModel>
  toDomain(record: Partial<PersistenceModel>): DomainModel
}
