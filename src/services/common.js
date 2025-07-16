const db = require("../../models");
const { Sequelize } = require("sequelize");

// Helper function to handle database operation with retry logic
async function executeWithRetry(operation, maxRetries = 3, delay = 2000) {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      // Check if it's a connection error
      if (error instanceof Sequelize.ConnectionError || 
          error.name === 'SequelizeConnectionError' || 
          error.message.includes('ETIMEDOUT')) {
        
        retries++;
        console.log(`Database operation failed (attempt ${retries}): ${error.message}`);
        
        if (retries >= maxRetries) {
          console.log(`Max retries (${maxRetries}) reached. Throwing error.`);
          throw error;
        }
        
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // For other types of errors, throw immediately
        throw error;
      }
    }
  }
}

const findOne = async (
	model,
	condition,
	attributes,
	optionalInclude = [],
	pageCondition,
	orderCondition = [],
	groupCondition = []
) => {
	return executeWithRetry(async () => {
		const result = await db[model].findOne({
			where: condition,
			attributes: attributes,
			...pageCondition,
			include: optionalInclude,
			group: groupCondition,
			order: orderCondition,
		});
		return result;
	});
};

const findAll = async (model, condition, attributes, optionalInclude = [], order = []) => {
	return executeWithRetry(async () => {
		const result = await db[model].findAll({
			where: condition,
			attributes: attributes,
			include: optionalInclude,
			order: order
		});
		return result;
	});
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
	return executeWithRetry(async () => {
		const result = await db[model].findAndCountAll({
			where: condition,
			attributes: attributes,
			include: optionalInclude,
			offset: offset,
			limit: limit,
			order: order
		});
		return result;
	});
};

const findByPk = async (
	model,
	primaryKey,
	attributes,
	optionalInclude = []
) => {
	return executeWithRetry(async () => {
		const result = await db[model].findByPk(primaryKey, {
			attributes: attributes,
			include: optionalInclude,
		});
		return result;
	});
};

const create = async (model, data) => {
	return executeWithRetry(async () => {
		const result = await db[model].create(data);
		return result;
	});
};

const bulkCreate = async (model, data) => {
	return executeWithRetry(async () => {
		const result = await db[model].bulkCreate(data);
		return result;
	});
};

const update = async (model, data, condition) => {
	return executeWithRetry(async () => {
		const result = await db[model].update(data, {
			where: condition,
		});
		return result;
	});
};

const upsert = async (model, data, condition) => {
	return executeWithRetry(async () => {
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
	});
};

const destroy = async (model, condition) => {
	return executeWithRetry(async () => {
		const result = await db[model].destroy({
			where: condition,
		});
		return result;
	});
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
