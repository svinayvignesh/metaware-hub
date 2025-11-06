-- meta.batchgroup definition

-- Drop table

-- DROP TABLE meta.batchgroup;

CREATE TABLE meta.batchgroup (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	"type" varchar NOT NULL,
	"name" varchar NOT NULL,
	status varchar NOT NULL,
	id varchar NOT NULL,
	CONSTRAINT batchgroup_pkey PRIMARY KEY (id)
);


-- meta.entity_relation definition

-- Drop table

-- DROP TABLE meta.entity_relation;

CREATE TABLE meta.entity_relation (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	id varchar(20) NOT NULL,
	target_en_id varchar NOT NULL,
	related_en_id varchar NOT NULL,
	relation_type varchar NOT NULL,
	metadata_ jsonb NULL,
	CONSTRAINT entity_relation_pkey PRIMARY KEY (id)
);


-- meta.glossary_relation_type definition

-- Drop table

-- DROP TABLE meta.glossary_relation_type;

CREATE TABLE meta.glossary_relation_type (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	short_description varchar(50) NOT NULL,
	description varchar NOT NULL,
	id varchar(20) NOT NULL,
	CONSTRAINT glossary_relation_type_pkey PRIMARY KEY (id)
);


-- meta."namespace" definition

-- Drop table

-- DROP TABLE meta."namespace";

CREATE TABLE meta."namespace" (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	"type" varchar NOT NULL,
	"name" varchar NOT NULL,
	runtime varchar NULL,
	privilege varchar NULL,
	tags varchar NULL,
	custom_props varchar NULL,
	github_repo varchar NULL,
	status varchar(20) NOT NULL,
	id varchar NOT NULL,
	CONSTRAINT namespace_pkey PRIMARY KEY (id)
);


-- meta.namespace1 definition

-- Drop table

-- DROP TABLE meta.namespace1;

CREATE TABLE meta.namespace1 (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	"type" varchar NOT NULL,
	"name" varchar NOT NULL,
	runtime varchar NULL,
	privilege varchar NULL,
	tags varchar NULL,
	custom_props varchar NULL,
	github_repo varchar NULL,
	status varchar(20) NOT NULL,
	id varchar NOT NULL,
	CONSTRAINT namespace_pkey1 PRIMARY KEY (id)
);


-- meta."rule" definition

-- Drop table

-- DROP TABLE meta."rule";

CREATE TABLE meta."rule" (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	"type" varchar NOT NULL,
	subtype varchar NULL,
	"name" varchar NOT NULL,
	alias varchar NOT NULL,
	description varchar NULL,
	rule_status varchar NOT NULL,
	is_shared bool NULL,
	rule_expression varchar NOT NULL,
	rule_priority int4 NULL,
	rule_category varchar NULL,
	rule_tags varchar NULL,
	rule_params varchar NULL,
	color varchar NULL,
	"language" varchar NULL,
	fn_name varchar NULL,
	fn_package varchar NULL,
	fn_imports varchar NULL,
	id varchar NOT NULL,
	CONSTRAINT rule_pkey PRIMARY KEY (id)
);


-- meta.table_info definition

-- Drop table

-- DROP TABLE meta.table_info;

CREATE TABLE meta.table_info (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	table_name varchar NOT NULL,
	schema_name varchar NULL,
	database_name varchar NULL,
	source_fqn varchar NULL,
	glossary_fqn varchar NULL,
	"type" varchar NULL,
	is_view bool NOT NULL,
	table_id varchar NULL,
	table_fqn varchar NOT NULL,
	CONSTRAINT table_info_pkey PRIMARY KEY (table_fqn)
);
CREATE INDEX idx_table_id ON meta.table_info USING btree (table_id);


-- meta."transform" definition

-- Drop table

-- DROP TABLE meta."transform";

CREATE TABLE meta."transform" (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	strategy varchar NOT NULL,
	"type" varchar NOT NULL,
	subtype varchar(20) NULL,
	"name" varchar(80) NULL,
	status varchar(20) NOT NULL,
	transform_config json NULL,
	id varchar NOT NULL,
	CONSTRAINT transform_pkey PRIMARY KEY (id)
);


-- meta.batchtask definition

-- Drop table

-- DROP TABLE meta.batchtask;

CREATE TABLE meta.batchtask (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	"type" varchar NOT NULL,
	"name" varchar NOT NULL,
	display_name varchar NOT NULL,
	status varchar NOT NULL,
	timezone varchar NOT NULL,
	retries int4 NOT NULL,
	execution_language varchar NOT NULL,
	execution_executor varchar NOT NULL,
	execution_command_line varchar NOT NULL,
	dependency varchar NULL,
	alert_email varchar NULL,
	associated_meta_id varchar NULL,
	associated_meta_type varchar NULL,
	id varchar NOT NULL,
	batch_group_id varchar NULL,
	CONSTRAINT batchtask_pkey PRIMARY KEY (id),
	CONSTRAINT batchtask_batch_group_id_fkey FOREIGN KEY (batch_group_id) REFERENCES meta.batchgroup(id) ON DELETE CASCADE
);


-- meta.column_info definition

-- Drop table

-- DROP TABLE meta.column_info;

CREATE TABLE meta.column_info (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	column_name varchar NOT NULL,
	column_expression varchar NULL,
	"type" varchar NOT NULL,
	subtype varchar NULL,
	"datatype" varchar NULL,
	"nullable" bool NULL,
	"default" varchar NULL,
	underlying_column varchar NULL,
	column_id varchar NULL,
	column_fqn varchar NOT NULL,
	table_fqn varchar NOT NULL,
	CONSTRAINT column_info_pkey PRIMARY KEY (column_fqn),
	CONSTRAINT column_info_table_fqn_fkey FOREIGN KEY (table_fqn) REFERENCES meta.table_info(table_fqn) ON DELETE CASCADE
);
CREATE INDEX idx_column_id ON meta.column_info USING btree (column_id);


-- meta.glossary_relation definition

-- Drop table

-- DROP TABLE meta.glossary_relation;

CREATE TABLE meta.glossary_relation (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	glossary_id varchar(20) NOT NULL,
	id varchar(20) NOT NULL,
	relation_type_code varchar(20) NOT NULL,
	related_glossary_id varchar(20) NOT NULL,
	CONSTRAINT glossary_relation_pkey PRIMARY KEY (id),
	CONSTRAINT glossary_relation_relation_type_code_fkey FOREIGN KEY (relation_type_code) REFERENCES meta.glossary_relation_type(id) ON DELETE CASCADE
);
CREATE INDEX idx_glossary_id ON meta.glossary_relation USING btree (glossary_id);


-- meta.subjectarea definition

-- Drop table

-- DROP TABLE meta.subjectarea;

CREATE TABLE meta.subjectarea (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	"type" varchar NOT NULL,
	"name" varchar NOT NULL,
	tags varchar NULL,
	custom_props varchar NULL,
	id varchar NOT NULL,
	ns_id varchar NOT NULL,
	CONSTRAINT subjectarea_pkey PRIMARY KEY (id),
	CONSTRAINT subjectarea_ns_id_fkey FOREIGN KEY (ns_id) REFERENCES meta."namespace"(id) ON DELETE CASCADE
);


-- meta.entity definition

-- Drop table

-- DROP TABLE meta.entity;

CREATE TABLE meta.entity (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	"type" varchar NOT NULL,
	subtype varchar NULL,
	"name" varchar NOT NULL,
	description varchar NULL,
	is_delta bool NULL,
	runtime varchar NULL,
	tags varchar NULL,
	custom_props json NULL,
	dependency varchar NULL,
	primary_grain varchar NULL,
	secondary_grain varchar NULL,
	tertiary_grain varchar NULL,
	id varchar NOT NULL,
	sa_id varchar NOT NULL,
	CONSTRAINT entity_pkey PRIMARY KEY (id),
	CONSTRAINT entity_sa_id_fkey FOREIGN KEY (sa_id) REFERENCES meta.subjectarea(id) ON DELETE CASCADE
);


-- meta.meta definition

-- Drop table

-- DROP TABLE meta.meta;

CREATE TABLE meta.meta (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	"type" varchar NOT NULL,
	subtype varchar NULL,
	"name" varchar NOT NULL,
	description varchar NOT NULL,
	"order" int4 NOT NULL,
	alias varchar NULL,
	length int4 NULL,
	"default" varchar NULL,
	"nullable" bool NULL,
	format varchar NULL,
	is_primary_grain bool NULL,
	is_secondary_grain bool NULL,
	is_tertiary_grain bool NULL,
	tags varchar NULL,
	custom_props json NULL,
	id varchar NOT NULL,
	en_id varchar NOT NULL,
	CONSTRAINT meta_pkey PRIMARY KEY (id),
	CONSTRAINT meta_en_id_fkey FOREIGN KEY (en_id) REFERENCES meta.entity(id) ON DELETE CASCADE
);


-- meta.semantic_execution_plan definition

-- Drop table

-- DROP TABLE meta.semantic_execution_plan;

CREATE TABLE meta.semantic_execution_plan (
	id varchar(255) NOT NULL,
	entity_id varchar(255) NOT NULL,
	plan_name varchar(255) NOT NULL,
	"version" int4 NOT NULL,
	layer varchar(64) NOT NULL,
	status varchar(32) DEFAULT 'draft'::character varying NOT NULL,
	description text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_by_ varchar(255) NULL,
	created_when_ timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_by_ varchar(255) NULL,
	updated_when_ timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT semantic_execution_plan_pkey PRIMARY KEY (id),
	CONSTRAINT semantic_execution_plan_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES meta.entity(id) ON DELETE CASCADE
);
CREATE INDEX idx_sep_entity_version ON meta.semantic_execution_plan USING btree (entity_id, version);


-- meta."source" definition

-- Drop table

-- DROP TABLE meta."source";

CREATE TABLE meta."source" (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	"type" varchar NOT NULL,
	source_filter varchar NULL,
	sql_override varchar NULL,
	id varchar NOT NULL,
	source_en_id varchar NULL,
	CONSTRAINT source_pkey PRIMARY KEY (id),
	CONSTRAINT source_source_en_id_fkey FOREIGN KEY (source_en_id) REFERENCES meta.entity(id) ON DELETE CASCADE
);


-- meta.conceptual_model definition

-- Drop table

-- DROP TABLE meta.conceptual_model;

CREATE TABLE meta.conceptual_model (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	id varchar NOT NULL,
	glossary_entity_id varchar NOT NULL,
	glossary_entity_fqn varchar NOT NULL,
	project_code varchar(50) NOT NULL,
	conceptual_model_fqn varchar NOT NULL,
	"name" varchar NOT NULL,
	CONSTRAINT conceptual_model_pkey PRIMARY KEY (id),
	CONSTRAINT uix_glossary_project UNIQUE (glossary_entity_fqn, project_code),
	CONSTRAINT conceptual_model_glossary_entity_id_fkey FOREIGN KEY (glossary_entity_id) REFERENCES meta.entity(id) ON DELETE CASCADE
);


-- meta.conceptual_model_meta definition

-- Drop table

-- DROP TABLE meta.conceptual_model_meta;

CREATE TABLE meta.conceptual_model_meta (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	id varchar NOT NULL,
	conceptual_model_id varchar NOT NULL,
	glossary_meta_id varchar NULL,
	"name" varchar NOT NULL,
	CONSTRAINT conceptual_model_meta_pkey PRIMARY KEY (id),
	CONSTRAINT conceptual_model_meta_conceptual_model_id_fkey FOREIGN KEY (conceptual_model_id) REFERENCES meta.conceptual_model(id) ON DELETE CASCADE,
	CONSTRAINT conceptual_model_meta_glossary_meta_id_fkey FOREIGN KEY (glossary_meta_id) REFERENCES meta.meta(id) ON DELETE CASCADE
);


-- meta.ruleset definition

-- Drop table

-- DROP TABLE meta.ruleset;

CREATE TABLE meta.ruleset (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	"type" varchar NOT NULL,
	"name" varchar NOT NULL,
	description varchar NULL,
	view_name varchar NULL,
	id varchar NOT NULL,
	target_en_id varchar NOT NULL,
	source_id varchar NULL,
	transform_id varchar NULL,
	CONSTRAINT ruleset_pkey PRIMARY KEY (id),
	CONSTRAINT ruleset_source_id_fkey FOREIGN KEY (source_id) REFERENCES meta."source"(id) ON DELETE CASCADE,
	CONSTRAINT ruleset_target_en_id_fkey FOREIGN KEY (target_en_id) REFERENCES meta.entity(id) ON DELETE CASCADE,
	CONSTRAINT ruleset_transform_id_fkey FOREIGN KEY (transform_id) REFERENCES meta."transform"(id) ON DELETE CASCADE
);


-- meta.ruleset_rules definition

-- Drop table

-- DROP TABLE meta.ruleset_rules;

CREATE TABLE meta.ruleset_rules (
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	id varchar NOT NULL,
	rule_id varchar NOT NULL,
	ruleset_id varchar NOT NULL,
	meta_id varchar NOT NULL,
	CONSTRAINT ruleset_rules_pkey PRIMARY KEY (id),
	CONSTRAINT ruleset_rules_meta_id_fkey FOREIGN KEY (meta_id) REFERENCES meta.meta(id) ON DELETE CASCADE,
	CONSTRAINT ruleset_rules_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES meta."rule"(id) ON DELETE CASCADE,
	CONSTRAINT ruleset_rules_ruleset_id_fkey FOREIGN KEY (ruleset_id) REFERENCES meta.ruleset(id) ON DELETE CASCADE
);


-- meta.semantic_execution_step definition

-- Drop table

-- DROP TABLE meta.semantic_execution_step;

CREATE TABLE meta.semantic_execution_step (
	id varchar(255) NOT NULL,
	plan_id varchar(255) NOT NULL,
	entity_id varchar(255) NOT NULL,
	entity_fqn varchar(512) NOT NULL,
	ruleset_id varchar(255) NULL,
	step_name varchar(255) NOT NULL,
	step_index int4 NOT NULL,
	kind varchar(64) NOT NULL,
	target_object varchar(255) NOT NULL,
	status varchar(32) DEFAULT 'pending'::character varying NOT NULL,
	description text NULL,
	created_by_ varchar(255) NULL,
	created_when_ timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_by_ varchar(255) NULL,
	updated_when_ timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT semantic_execution_step_pkey PRIMARY KEY (id),
	CONSTRAINT uq_ses_plan_stepindex UNIQUE (plan_id, step_index),
	CONSTRAINT uq_ses_plan_stepname UNIQUE (plan_id, step_name),
	CONSTRAINT semantic_execution_step_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES meta.entity(id) ON DELETE CASCADE,
	CONSTRAINT semantic_execution_step_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES meta.semantic_execution_plan(id) ON DELETE CASCADE,
	CONSTRAINT semantic_execution_step_ruleset_id_fkey FOREIGN KEY (ruleset_id) REFERENCES meta.ruleset(id)
);
CREATE INDEX idx_ses_entity ON meta.semantic_execution_step USING btree (entity_id);
CREATE INDEX idx_ses_plan ON meta.semantic_execution_step USING btree (plan_id);


-- meta.glossary_association_view definition

-- Drop table

-- DROP TABLE meta.glossary_association_view;

CREATE TABLE meta.glossary_association_view (
	id text NOT NULL,
	glossary_entity_id text NOT NULL,
	glossary_entity_fqn text NOT NULL,
	source_entity_id text NOT NULL,
	source_entity_fqn text NOT NULL,
	view_name text NOT NULL,
	view_fqn text NOT NULL,
	ruleset_id text NOT NULL,
	plan_id text NULL,
	step_id text NULL,
	artifact_id text NULL,
	status text DEFAULT 'active'::text NULL,
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	CONSTRAINT glossary_association_view_pkey PRIMARY KEY (id),
	CONSTRAINT glossary_association_view_glossary_entity_id_fkey FOREIGN KEY (glossary_entity_id) REFERENCES meta.entity(id) ON DELETE CASCADE,
	CONSTRAINT glossary_association_view_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES meta.semantic_execution_plan(id),
	CONSTRAINT glossary_association_view_ruleset_id_fkey FOREIGN KEY (ruleset_id) REFERENCES meta.ruleset(id) ON DELETE CASCADE,
	CONSTRAINT glossary_association_view_source_entity_id_fkey FOREIGN KEY (source_entity_id) REFERENCES meta.entity(id) ON DELETE CASCADE
);
CREATE INDEX idx_glossary_assoc_view_fqn ON meta.glossary_association_view USING btree (view_fqn);
CREATE INDEX idx_glossary_assoc_view_glossary ON meta.glossary_association_view USING btree (glossary_entity_id);
CREATE INDEX idx_glossary_assoc_view_source ON meta.glossary_association_view USING btree (source_entity_id);


-- meta.glossary_publish_config definition

-- Drop table

-- DROP TABLE meta.glossary_publish_config;

CREATE TABLE meta.glossary_publish_config (
	id text NOT NULL,
	glossary_entity_id text NOT NULL,
	glossary_entity_fqn text NOT NULL,
	target_entity_id text NULL,
	target_runtime text NOT NULL,
	target_profile text NOT NULL,
	target_namespace text NOT NULL,
	target_schema text NULL,
	target_name text NOT NULL,
	target_fqn text NOT NULL,
	ruleset_id text NOT NULL,
	materialize_as text DEFAULT 'view'::text NULL,
	publish_plan_id text NULL,
	"options" json NULL,
	status text DEFAULT 'draft'::text NULL,
	"version" int4 DEFAULT 1 NULL,
	created_by_ varchar NULL,
	created_when_ timestamp NULL,
	updated_by_ varchar NULL,
	updated_when_ timestamp NULL,
	CONSTRAINT glossary_publish_config_pkey PRIMARY KEY (id),
	CONSTRAINT glossary_publish_config_glossary_entity_id_fkey FOREIGN KEY (glossary_entity_id) REFERENCES meta.entity(id) ON DELETE CASCADE,
	CONSTRAINT glossary_publish_config_publish_plan_id_fkey FOREIGN KEY (publish_plan_id) REFERENCES meta.semantic_execution_plan(id),
	CONSTRAINT glossary_publish_config_ruleset_id_fkey FOREIGN KEY (ruleset_id) REFERENCES meta.ruleset(id) ON DELETE CASCADE
);
CREATE INDEX idx_glossary_publish_glossary_entity ON meta.glossary_publish_config USING btree (glossary_entity_id);
CREATE INDEX idx_glossary_publish_plan ON meta.glossary_publish_config USING btree (publish_plan_id);
CREATE INDEX idx_glossary_publish_target_fqn ON meta.glossary_publish_config USING btree (target_fqn);


-- meta.semantic_artifact definition

-- Drop table

-- DROP TABLE meta.semantic_artifact;

CREATE TABLE meta.semantic_artifact (
	id varchar(255) NOT NULL,
	plan_id varchar(255) NOT NULL,
	step_id varchar(255) NOT NULL,
	artifact_type varchar(64) NOT NULL,
	artifact_name varchar(255) NOT NULL,
	dialect_hint varchar(32) DEFAULT 'ansi'::character varying NOT NULL,
	ast_json jsonb NOT NULL,
	table_info_json jsonb NOT NULL,
	compiled_sql text NULL,
	description text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_by_ varchar(255) NULL,
	created_when_ timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_by_ varchar(255) NULL,
	updated_when_ timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT semantic_artifact_pkey PRIMARY KEY (id),
	CONSTRAINT semantic_artifact_step_id_fkey FOREIGN KEY (step_id) REFERENCES meta.semantic_execution_step(id) ON DELETE CASCADE
);
CREATE INDEX idx_saf_plan ON meta.semantic_artifact USING btree (plan_id);
CREATE INDEX idx_saf_step ON meta.semantic_artifact USING btree (step_id);
CREATE UNIQUE INDEX uq_saf_step_name_dialect ON meta.semantic_artifact USING btree (step_id, artifact_name, dialect_hint);