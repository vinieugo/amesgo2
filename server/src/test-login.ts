import axios from 'axios';

const testLogin = async () => {
  try {
    console.log('Testando login com credenciais padrão...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Login bem-sucedido!');
    console.log('Resposta:', response.data);
  } catch (error: any) {
    console.error('Erro ao fazer login:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
};

testLogin(); 