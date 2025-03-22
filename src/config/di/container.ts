type ServiceFactory<T> = () => T;

class Container {
  private services: Map<string, any> = new Map();
  private factories: Map<string, ServiceFactory<any>> = new Map();

  // Register a service instance
  register<T>(name: string, instance: T): void {
    this.services.set(name, instance);
  }

  // Register a factory function to create a service
  registerFactory<T>(name: string, factory: ServiceFactory<T>): void {
    this.factories.set(name, factory);
  }

  // Get a service by name
  get<T>(name: string): T {
    // If service instance exists, return it
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }

    // If factory exists, create the service and cache it
    if (this.factories.has(name)) {
      const factory = this.factories.get(name) as ServiceFactory<T>;
      const instance = factory();
      this.services.set(name, instance);
      return instance;
    }

    throw new Error(`Service "${name}" not found`);
  }

  // Clear all services (useful for testing)
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

// Export a singleton instance
export const container = new Container();

// Export the container type for extension
export type { Container };
