import prisma from '../../database/db.js';

export class EmployeeRepository {
  /**
   * Crear un nuevo empleado
   */
  async create(data) {
    try {
      const {
        firstName, lastName, email, password, role, identityCard, address, phone
      } = data;

      const employee = await prisma.employee.create({
        data: {
          firstName,
          lastName,
          email,
          password,
          role: role || 'employee',
          identityCard,
          address,
          phone,
          isActive: true
        },
      });

      return employee;
    } catch (error) {
      throw new Error(`Error al crear empleado: ${error.message}`);
    }
  }

  /**
   * Obtener un empleado por ID
   */
  async findById(id) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id }
      });
      return employee;
    } catch (error) {
      throw new Error(`Error al obtener empleado: ${error.message}`);
    }
  }

  /**
   * Obtener todos los empleados
   */
  async findAll(options = {}) {
    try {
      const { skip = 0, take = 10, q } = options;

      const where = {};

      if (q) {
        where.OR = [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { identityCard: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
        ];
      }

      const employees = await prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      });

      return employees;
    } catch (error) {
      throw new Error(`Error al obtener empleados: ${error.message}`);
    }
  }

  /**
   * Buscar empleados por email
   */
  async findByEmail(email) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { email },
      });
      return employee;
    } catch (error) {
      throw new Error(`Error al buscar empleado: ${error.message}`);
    }
  }

  /**
   * Buscar empleados por cédula
   */
  async findByIdentityCard(identityCard) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { identityCard },
      });
      return employee;
    } catch (error) {
      throw new Error(`Error al buscar empleado por cédula: ${error.message}`);
    }
  }

  /**
   * Actualizar un empleado
   */
  async update(id, data) {
    try {
      const {
        firstName, lastName, email, password, role, address, phone, trackingConsent, isActive
      } = data;

      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (password !== undefined) updateData.password = password;
      if (role !== undefined) updateData.role = role;
      if (address !== undefined) updateData.address = address;
      if (phone !== undefined) updateData.phone = phone;
      if (trackingConsent !== undefined) updateData.trackingConsent = trackingConsent;
      if (isActive !== undefined) updateData.isActive = isActive;

      const employee = await prisma.employee.update({
        where: { id },
        data: updateData,
      });

      return employee;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Empleado no encontrado');
      }
      throw new Error(`Error al actualizar empleado: ${error.message}`);
    }
  }

  /**
   * Eliminar un empleado
   */
  async delete(id) {
    try {
      const employee = await prisma.employee.delete({
        where: { id },
      });
      return employee;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new Error('Empleado no encontrado');
      }
      throw new Error(`Error al eliminar empleado: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de empleados (simplificado)
   */
  async getSalaryStats() {
    try {
      const count = await prisma.employee.count();
      return {
        total: count,
        sum: 0,
        average: 0,
        min: 0,
        max: 0,
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener departamentos únicos (simplificado para roles o cargos)
   */
  async getUniqueDepartments() {
    return ['Logística', 'Operaciones', 'Administración'];
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}

export default new EmployeeRepository();
