// Arquivo temporário para testar importações
import { IApiModule } from '../types/api.types';

// Função de teste
function testImport(module: IApiModule): void {
  console.log(`Módulo: ${module.name}, Versão: ${module.version}`);
}

export default testImport; 