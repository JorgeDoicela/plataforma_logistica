import employeeRepository from '../../repositories/employees/employeeRepository.js';
import auditRepository from '../../repositories/audit/auditRepository.js';

export class EmployeeService {
  /**
   * Crear un nuevo empleado
   */
  async createEmployee(employeeData) {
    this.validateEmployeeData(employeeData);

    const existingEmployee = await employeeRepository.findByEmail(employeeData.email);
    if (existingEmployee) {
      throw new Error('El email ya está registrado');
    }

    if (employeeData.identityCard) {
      const existingIdentityCard = await employeeRepository.findByIdentityCard(employeeData.identityCard);
      if (existingIdentityCard) {
        throw new Error('La cédula ya está registrada');
      }
    }

    const employee = await employeeRepository.create(employeeData);

    auditRepository.createLog({
      entity: 'Employee',
      entityId: employee.id,
      action: 'CREATE',
      performedBy: 'System',
      details: { firstName: employee.firstName, lastName: employee.lastName, role: employee.role }
    }).catch(err => console.error('Error logging employee creation:', err));

    return employee;
  }

  /**
   * Obtener un empleado por ID
   */
  async getEmployee(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new Error('Empleado no encontrado');
    }
    return employee;
  }

  /**
   * Obtener todos los empleados
   */
  async getAllEmployees(options = {}) {
    return await employeeRepository.findAll(options);
  }

  /**
   * Actualizar un empleado
   */
  async updateEmployee(id, updateData, userId) {
    if (!id || typeof id !== 'string') {
      throw new Error('ID de empleado inválido');
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No hay datos para actualizar');
    }

    if (updateData.email) {
      const employee = await employeeRepository.findByEmail(updateData.email);
      if (employee && employee.id !== id) {
        throw new Error('El email ya está registrado por otro empleado');
      }
    }

    this.validateEmployeeData(updateData, true);

    const oldData = await this.getEmployee(id);
    const updatedEmployee = await employeeRepository.update(id, updateData);

    const changes = {};
    Object.keys(updateData).forEach(key => {
      if (JSON.stringify(updateData[key]) !== JSON.stringify(oldData[key])) {
        changes[key] = { from: oldData[key], to: updateData[key] };
      }
    });

    if (userId && Object.keys(changes).length > 0) {
      auditRepository.createLog({
        entity: 'Employee',
        entityId: id,
        action: 'UPDATE',
        performedBy: userId,
        details: changes
      }).catch(err => console.error('Error logging employee update:', err));
    }

    return updatedEmployee;
  }

  /**
   * Eliminar un empleado
   */
  async deleteEmployee(id) {
    if (!id || typeof id !== 'string') {
      throw new Error('ID de empleado inválido');
    }
    const deleted = await employeeRepository.delete(id);

    auditRepository.createLog({
      entity: 'Employee',
      entityId: id,
      action: 'DELETE',
      performedBy: 'Admin',
      details: `Deleted employee ${id}`
    }).catch(err => console.error('Error logging employee deletion:', err));

    return deleted;
  }

  /**
   * Obtener estadísticas de empleados
   */
  async getSalaryStatistics() {
    return await employeeRepository.getSalaryStats();
  }

  /**
   * Validar datos de un empleado
   */
  validateEmployeeData(data, isPartial = false) {
    const { firstName, lastName, email, phone } = data;

    if (!isPartial) {
      if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) throw new Error('Nombre requerido');
      if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) throw new Error('Apellido requerido');
      if (!email || typeof email !== 'string' || !this.isValidEmail(email)) throw new Error('Email inválido');
      if (phone && !/^\d{10}$/.test(phone)) throw new Error('El teléfono debe tener exactamente 10 dígitos numéricos');
    } else {
      if (firstName !== undefined && (typeof firstName !== 'string' || firstName.trim().length === 0)) throw new Error('Nombre inválido');
      if (lastName !== undefined && (typeof lastName !== 'string' || lastName.trim().length === 0)) throw new Error('Apellido inválido');
      if (email !== undefined && (typeof email !== 'string' || !this.isValidEmail(email))) throw new Error('Email inválido');
      if (phone !== undefined && phone !== null && !/^\d{10}$/.test(phone)) throw new Error('El teléfono debe tener exactamente 10 dígitos numéricos');
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async getDepartments() {
    return await employeeRepository.getUniqueDepartments();
  }
}

export default new EmployeeService();
