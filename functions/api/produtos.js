export async function onRequestGet({ env }) {
    try {
        const { results } = await env.DB
            .prepare(`
                SELECT *
                FROM produtos
                ORDER BY id DESC
            `)
            .all();

        return Response.json(results);
    } catch (error) {
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }
}


export async function onRequestPost({ request, env }) {
    try {
        const produto = await request.json();

        if (!produto.nome) {
            return Response.json(
                { error: "Nome obrigatório" },
                { status: 400 }
            );
        }

        const resultado = await env.DB
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
            id: resultado.meta.last_row_id,
            ...produto
        });

    } catch (error) {
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }
}


export async function onRequestPut({ request, env, params }) {
    try {
        const produto = await request.json();

        await env.DB
            .prepare(`
                UPDATE produtos
                SET
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
                params.id
            )
            .run();

        return Response.json({
            id: Number(params.id),
            ...produto
        });

    } catch (error) {
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }
}


export async function onRequestDelete({ env, params }) {
    try {

        await env.DB
            .prepare(`
                DELETE FROM produtos
                WHERE id = ?
            `)
            .bind(params.id)
            .run();

        return Response.json({
            ok: true
        });

    } catch (error) {

        return Response.json(
            { error: error.message },
            { status: 500 }
        );

    }
}
