import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  UpdateDateColumn,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { ObjectType, Field, ID, Root } from "type-graphql";
import { Model } from "./Model";
import { LIVE_SESSION_STATUS } from "../types/DataTypes";

@ObjectType()
@Entity()
export class LiveSession extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  // @Field(() => Affilate, { nullable: true, })
  //   @ManyToOne(() => Affilate, { onDelete: "CASCADE" })
  //   @JoinColumn({ name: 'affilate' })
  //   affilate: Affilate;

  @Field(() => Model, { nullable: true })
  @ManyToOne(() => Model, {
    eager: true,
    onDelete:'CASCADE'
  })
  @JoinColumn({name:"model"})
  model: Model;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column({
    type: "enum",
    default: LIVE_SESSION_STATUS.IN_PROGRESS,
    enum: LIVE_SESSION_STATUS,
  })
  status: string;

  @Field(()=> SessionGoal)
  @OneToMany(() => SessionGoal, (goal) => goal.session,{onDelete:'CASCADE'})
  goals: SessionGoal[];

  @OneToMany(() => SessionMessages, (message) => message.session,{onDelete:'CASCADE'})
  messages: SessionMessages[];

  @Field()
  @Column({ default: 0 })
  netTokens: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  endedAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;
}

@ObjectType()
@Entity()
export class SessionGoal extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LiveSession, (liveSession) => liveSession.goals)
  session: LiveSession;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column({ default: false })
  isAchived: boolean;

  @Field()
  @Column({ default: 0 })
  tokensAchived: number;

  @Field()
  @Column({ default: 1 })
  tokenValue: number;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;
}

@ObjectType()
@Entity()
export class SessionMessages extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LiveSession, (liveSession) => liveSession.messages)
  session: LiveSession;

  @Field()
  @Column()
  message: string;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;
}
