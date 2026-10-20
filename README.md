# VEHICLE STATUS 2.2

Sistema de garantia veicular com **4 portais separados** que compartilham a **mesma base de dados** (IndexedDB no navegador).

Alterações feitas no **Admin** ou no **Técnico** aparecem automaticamente nos outros portais (mesma origem HTTP).

---

## 🌐 Demo online

| Portal      | Link |
| ----------- | ---- |
| **Admin**   | https://sukuna-101.github.io/VEHICLE-STATUS/admin/ |
| **Técnico** | https://sukuna-101.github.io/VEHICLE-STATUS/tecnico/ |
| **Usuário** | https://sukuna-101.github.io/VEHICLE-STATUS/usuario/ |
| **Cliente** | https://sukuna-101.github.io/VEHICLE-STATUS/cliente/ |

Hub de entrada: https://sukuna-101.github.io/VEHICLE-STATUS/

---

## Portais

| Portal      | URL         | Senha?  | Poderes |
| ----------- | ----------- | ------- | ------- |
| **Admin**   | `/admin/`   | Sim     | Criar, editar todos, excluir, import/export, gerir usuários |
| **Técnico** | `/tecnico/` | Sim     | Criar e editar **somente os que ele cadastrou**; **não** pode apagar |
| **Usuário** | `/usuario/` | **Não** | Só visualizar todos os registros |
| **Cliente** | `/cliente/` | Sim     | Só visualizar seriais cujo **nome** bate com o vinculado à conta |

---

## Contas demo (com senha)

| Portal  | Usuário   | Senha      | Observação |
| ------- | --------- | ---------- | ---------- |
| Admin   | `admin`   | `admin123` | Acesso total |
| Técnico | `tecnico` | `tec123`   | Só edita o que cadastrou |
| Cliente | `cliente` | `cli123`   | Vê registros “MARCIO BRITO” |

**Usuário** abre direto, sem login.

O Admin pode criar mais contas de Admin, Técnico ou Cliente (todas com senha). Não existe conta com senha para o papel “Usuário”.

---

## Como executar localmente

```bash
cd VEHICLE-STATUS
python3 -m http.server 8080
