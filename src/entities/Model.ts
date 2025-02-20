import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  UpdateDateColumn,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
  OneToMany,
} from "typeorm";
import { ObjectType, Field, ID, Root } from "type-graphql";
import { LiveSession } from "./LiveSession";


@ObjectType()
@Entity()
export class ModelDocuments extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  passport_front: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  passport_back: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  selfie_with_id: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  proof_of_address: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  business_certification: string;
}

@ObjectType()
@Entity()
export class BasicInfo extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  dob: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  eyecolor: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  gender: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  haircolor: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  height: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  weight: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  profession: string;
}

@ObjectType()
@Entity()
export class Address extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  address: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  city: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  country: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  country_code: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  telephone: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  zipcode: string;
}

@ObjectType()
@Entity()
export class Model extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  username: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatar: string;

  @Column()
  password: string;

  @Field()
  @Column({ default: 0 })
  profileSetupStep: number;

  @Field()
  @Column({ default: false })
  profileComplete: Boolean;

  @Field()
  @Column({ default: 'not_verified' })
  documentsVerified: String;

  @Field(() => BasicInfo, { nullable: true })
  @OneToOne(() => BasicInfo, { onDelete: "CASCADE" })
  @JoinColumn()
  basic_info: BasicInfo;

  @Field(() => Address, { nullable: true })
  @OneToOne(() => Address, { onDelete: "CASCADE" })
  @JoinColumn()
  address: Address;

  @Field(() => ModelDocuments, { nullable: true })
  @OneToOne(() => ModelDocuments, { onDelete: "CASCADE" })
  @JoinColumn()
  documents: ModelDocuments;

  @OneToMany(() => LiveSession, (liveSession) => liveSession.model,{onDelete:'CASCADE'})
  live_sessions: LiveSession[]

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;
}




