export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =====================================================
    // VERIFICAR SENHA DO ADMINISTRADOR
    // =====================================================

    function verificarAdmin(request) {
      const auth = request.headers.get("Authorization");

      if (!auth || !auth.startsWith("Basic ")) {
        return false;
      }

      try {
        const decoded = atob(auth.substring(6));

        const separador = decoded.indexOf(":");

        if (separador === -1) {
          return false;
        }

        const usuario = decoded.substring(0, separador);
        const senha = decoded.substring(separador + 1);

        return (
          usuario === "admin" &&
          senha === env.ADMIN_PASSWORD
        );

      } catch {
        return false;
      }
    }

    // =====================================================
    // RESPOSTA DE ACESSO NEGADO
    // NÃO usa WWW-Authenticate
    // =====================================================

    function naoAutorizado() {
      return Response.json(
        {
          error: "Não autorizado"
        },
        {
          status: 401
        }
      );
    }

    // =====================================================
    // TESTAR LOGIN
    // =====================================================

    if (
      url.pathname === "/api/admin/teste" &&
      request.method === "GET"
    ) {
      if (!verificarAdmin(request)) {
        return naoAutorizado();
      }

      return Response.json({
        ok: true
      });
    }

    // =====================================================
    // LISTAR PRODUTOS
    // PÚBLICO
    // =====================================================

    if (
      url.pathname === "/api/produtos" &&
      request.method === "GET"
    ) {
      try {
        const { results } = await env.DB
          .prepare(
            "SELECT * FROM produtos ORDER BY id DESC"
          )
          .all();

        return Response.json(results);

      } catch (error) {
        return Response.json(
          {
            error: error.message
          },
          {
            status: 500
          }
        );
      }
    }

    // =====================================================
    // CRIAR PRODUTO
    // PROTEGIDO
    // =====================================================

    if (
      url.pathname === "/api/produtos" &&
      request.method === "POST"
    ) {
      if (!verificarAdmin(request)) {
        return naoAutorizado();
      }

      try {
        const produto = await request.json();

        if (!produto.nome) {
          return Response.json(
            {
              error: "Nome obrigatório"
            },
            {
              status: 400
            }
          );
        }

        const result = await env.DB
          .prepare(`
            INSERT INTO produtos
            (
              nome,
              codigo,
              categoria,
              marca,
              descricao,
              especificacoes,
              imagem
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            produto.nome,
            produto.codigo || "",
            produto.categoria || "",
            produto.marca || "",
            produto.descricao || "",
            produto.especificacoes || "",
            produto.imagem || ""
          )
          .run();

        return Response.json({
          id: result.meta.last_row_id,
          ...produto
        });

      } catch (error) {
        return Response.json(
          {
            error: error.message
          },
          {
            status: 500
          }
        );
      }
    }

    // =====================================================
    // EDITAR PRODUTO
    // PROTEGIDO
    // =====================================================

    if (
      url.pathname.startsWith("/api/produtos/") &&
      request.method === "PUT"
    ) {
      if (!verificarAdmin(request)) {
        return naoAutorizado();
      }

      try {
        const id =
          url.pathname.split("/").pop();

        const produto =
          await request.json();

        await env.DB
          .prepare(`
            UPDATE produtos SET
              nome = ?,
              codigo = ?,
              categoria = ?,
              marca = ?,
              descricao = ?,
              especificacoes = ?,
              imagem = ?
            WHERE id = ?
          `)
          .bind(
            produto.nome,
            produto.codigo || "",
            produto.categoria || "",
            produto.marca || "",
            produto.descricao || "",
            produto.especificacoes || "",
            produto.imagem || "",
            id
          )
          .run();

        return Response.json({
          ok: true
        });

      } catch (error) {
        return Response.json(
          {
            error: error.message
          },
          {
            status: 500
          }
        );
      }
    }

    // =====================================================
    // EXCLUIR PRODUTO
    // PROTEGIDO
    // =====================================================

    if (
      url.pathname.startsWith("/api/produtos/") &&
      request.method === "DELETE"
    ) {
      if (!verificarAdmin(request)) {
        return naoAutorizado();
      }

      try {
        const id =
          url.pathname.split("/").pop();

        await env.DB
          .prepare(
            "DELETE FROM produtos WHERE id = ?"
          )
          .bind(id)
          .run();

        return Response.json({
          ok: true
        });

      } catch (error) {
        return Response.json(
          {
            error: error.message
          },
          {
            status: 500
          }
        );
      }
    }

    // =====================================================
    // SERVIR O INDEX.HTML / SITE
    // =====================================================

    return env.ASSETS.fetch(request);
  }
};
