const db = require("../models");

const findOne = async (
	model,
	condition,
	attributes,
	optionalInclude = [],
	pageCondition,
	orderCondition = [],
	groupCondition = []
) => {
	const result = await db[model].findOne({
		where: condition,
		attributes: attributes,
		...pageCondition,
		include: optionalInclude,
		group: groupCondition,
		order: orderCondition,
	});
	return result;
};

const findAll = async (model, condition, attributes, optionalInclude = [], order = []) => {
	const result = await db[model].findAll({
		where: condition,
		attributes: attributes,
		include: optionalInclude,
		order: order
	});
	return result;
};

const findAndCountAll = async (
	model,
	condition,
	attributes,
	offset,
	limit = 10,
	order,
	optionalInclude = []
) => {
	const result = await db[model].findAndCountAll({
		where: condition,
		attributes: attributes,
		include: optionalInclude,
		offset: offset,
		limit: limit,
		order: order
	});
	return result;
};

const findByPk = async (
	model,
	primaryKey,
	attributes,
	optionalInclude = []
) => {
	const result = await db[model].findByPk(primaryKey, {
		attributes: attributes,
		include: optionalInclude,
	});
	return result;
};

const create = async (model, data) => {
	const result = await db[model].create(data);
	return result;
};

const bulkCreate = async (model, data) => {
	const result = await db[model].bulkCreate(data);
	return result;
};

const update = async (model, data, condition) => {
	const result = await db[model].update(data, {
		where: condition,
	});
	return result;
};

const upsert = async (model, data, condition) => {
	const result = await db[model].upsert(
		{
			...data,
			...condition,
		},
		{
			where: condition,
		}
	);
	return result;
};

const destroy = async (model, condition) => {
	const result = await db[model].destroy({
		where: condition,
	});
	return result;
};

module.exports = {
	findOne,
	findAll,
	findAndCountAll,
	create,
	bulkCreate,
	update,
	upsert,
	destroy,
	findByPk,
};
