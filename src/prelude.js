/**
 * Adaptación de las funciones sobre listas más habituales del preludio Haskell
 *
 * Nota:
 * - null induce a confusión en este contexto ya que un vector puede ser nulo o vacío.
 * - !! No ha sido implementada, no tiene sentido en este contexto.
 * - La sobreescritura de concat para listas de listas ha sido renombrada como flatten.
 * - La función break ha sido renombrada como unSpan.
 *
 * v0.2 Copyright ® 2013 <rgalacho@gmail.com>
 **/

/**
 * Funciones auxiliares y constantes
 */

/**
 * Datos de la librería.
 *
 * version: Versión actual
 * 
 * autor: Un poco de auto-reconocimiento...
 *
 * cuasiInfinito: Constante de simulación de vectores infinitos.
 *                No es posible simular la evaluación perezosa pero sí
 *                que es posible generar un vector lo suficientemente
 *                grande como para realizar operaciones take/drop que
 *                no consuman mucho tiempo de ejecución y que
 *                proporcionen la impresión de estar trabajando con
 *                vectores cuasi-infinitos.
 **/
var PreludeJS = { version: 0.2,
                  autor: "R.Galacho",
                  cuasiInfinito: 1000 };

/**
 * exception crea un nuevo objeto de tipo excepción.
 *
 * @param {String} nivel Nivel de error
 * @param {String} mensaje Mensaje descriptivo en texto plano
 * @param {String} html Mensaje descriptivo en formato HTML
 * @return {Exception} Instancia Exception
 *
 * @since 0.1
 **/
function exception(nivel, mensaje, html) {
    return { name:        "PreludeJS", 
             level:       nivel, 
             message:     mensaje, 
             htmlMessage: html,
             toString:    function(){ return this.name + ": " + this.message; } };
}

/**
 * isNull testea si el vector xs es nulo.
 * @example
 * isNull(null) => true
 *
 * @param {Array} xs Vector
 * @return {Boolean} true si el vector xs es nulo.
 **/
function isNull(xs) {
    return xs === null;
}

/**
 * isNullOrEmpty testea si el vector xs es nulo o está vacío.
 * @example
 * isNullOrEmpty(null) == isNullOrEmpty([]) => true
 *
 * @param {Array} xs Vector
 * @return {Boolean} true si el vector xs es nulo o está vacío.
 **/
function isNullOrEmpty(xs) {
    return (isNull(xs) || xs.length === 0);
}

/**
 * checkIfNullOrEmpty chequea si un vector está vacío, lanzando una excepción en caso afirmativo.
 * @example
 * checkIfNullOrEmpty([]) => true
 *
 * @param {Function} funcion Nombre de la función que comprueba la restricción
 * @param {Array} xs Vector a chequear
 * @return {Exception} Instancia de Exception
 *
 * @since 0.1
 **/
function checkIfNullOrEmpty(funcion, xs) {
    if (isNullOrEmpty(xs))
        throw exception("Error", funcion + ": El vector no puede ser nulo o estar vacío.",
                        "<i>" + funcion + "</i>: El vector no puede ser nulo o estar vac&iacute;o.");
}

/**
 * Operaciones sobre vectores
 */

/**
 * map(f, xs) es el vector obtenida de aplicar f a cada elemento del vector.
 * @example
 * map(f, [x1, x2, ..., xn]) => [f x1, f x2, ..., f xn]
 *
 * @param {Function} f Función
 * @param {Array} xs Array
 * @return {Array} Nuevo vector resultante de aplicar f a los elementos de l
 *
 * @since 0.1
 **/
function map(f, xs) {
    if (isNullOrEmpty(xs))
        return xs;

    if (('splice' in xs) && Array.prototype.map)
        return xs.map(f);
    else {
        var result = new Array();
        for (var i = 0; i < xs.length; i++)
            result.push(f.apply(null, [xs[i]]));
        return result;
    }
}

/**
 * concat(xs, ys) une dos vectores.
 * @example
 * concat(['a', 'b', 'c'], [1, 2, 3]) => ['a', 'b', 'c', 1, 2, 3]
 *
 * @param {Array} xs Vector
 * @param {Array} ys Vector
 * @return {Array} Nuevo vector resultante de unir xs e ys
 *
 * @since 0.1
 */
function concat(xs, ys) {
    var xxs = (xs)? xs : new Array();
    var yys = (ys)? ys : new Array();

    if (Array.prototype.concat)
        return xxs.concat(yys);
    else {
        var insert = function (ac, it) { ac.push(it); return ac;};

        return foldl(insert, foldl(insert, new Array(), xs), ys);
    }
}

/**
 * filter(p, xs) retorna aquellos elementos de xs que satisfacen el predicado p.
 * @example
 * filter(function (it) { return it % 2 == 0; }, [1, 2, 3, 4]) => [2,4]
 *
 * @param {Function} p Predicado (función booleana)
 * @param {Array} xs Vector
 * @return {Array} Elementos de xs que cumplen p
 *
 * @since 0.1 
 */
function filter(p, xs) {
    if (Array.prototype.filter)
        return xs.filter(p);
    else {
        return foldl(function (ac, it) {
                         if (p.apply(null, [it]))
                             ac.push(it);
                         return ac;
                     },
                     [], xs);
    }
}

/**
 * head(xs) retorna el primer elemento de xs, xs no puede estar vacío.
 * @example
 * head([1, 2, 3]) => 1
 *
 * @param {Array} xs Vector
 * @return {Object} Primer elemento de xs
 *
 * @since 0.1
 */
function head(xs) {
    checkIfNullOrEmpty("head", xs);
    return xs[0];
}

/**
 * last(xs) retorna el último elemento de xs, xs no puede estar vacío.
 * @example
 * last([1, 2, 3]) => 3
 *
 * @param {Array} xs Vector
 * @return {Object} Último elemento de xs
 *
 * @since 0.1
 */
function last(xs) {
    checkIfNullOrEmpty("last", xs);
    return xs[xs.length - 1];
}

/**
 * tail(xs) retorna los elementos de xs salvo el primero, xs no puede estar vacío.
 * @example
 * tail([1, 2, 3]) => [2, 3]
 *
 * @param {Array} xs Vector
 * @return {Array} Elementos de xs salvo el primero
 *
 * @since 0.1
 */
function tail(xs) {
    checkIfNullOrEmpty("tail", xs);
    return xs.slice(1);
}

/**
 * init(xs) retorna los elementos de xs salvo el último, xs no puede estar vacío.
 * @example
 * init([1, 2, 3]) => [1, 2]
 *
 * @param {Array} xs Vector
 * @return {Array} Elementos de xs salvo el último
 *
 * @since 0.1
 */
function init(xs) {
    checkIfNullOrEmpty("init", xs);
    return xs.slice(0, -1);
}

/**
 * length(xs) retorna la longitud del vector xs.
 * @example
 * length([1, 2]) => 2
 *
 * @param {Array} xs Vector
 * @return {Number} La longitud del vector xs
 *
 * @since 0.1
 **/
function length(xs) {
    if (isNullOrEmpty(xs))
        return 0;
    else
        return xs.length;
}

/**
 * reverse(xs) invierte el vector xs.
 * @example
 * reverse([1, 2, 3]) => [3, 2, 1]
 *
 * @param {Array} xs Vector
 * @return {Array} El vector xs invertido
 **/
function reverse(xs) {
    if (isNull(xs))
        throw exception("Error",
                        "reverse: El vector no puede ser nulo.",
                        "<i>reverse</i>: El vector no puede ser nulo.");
    else
        return xs.reverse();
}

/**
 * Plegados
 **/

/**
 * foldlAux(f, init, xs) es una función auxiliar encargada de recorrer
 * el vector por la izquierda aplicando la función f.
 * @example
 * foldlAux(function (accum, it) { return accum + it; }, 0, [1, 2, 3]) => 6
 *
 * @param {Function} f Función a aplicar
 * @param {Object} accum Valor acumulado
 * @param {Array} xs Vector
 * @return {Object} El valor acumulado tras plegar por la izquierda el vector
 *        xs por la izquierda aplicando la función f
 *
 * @since 0.1
 */
function foldlAux(f, accum, xs) {
    if (isNullOrEmpty(xs))
        return accum;
    return foldlAux(f, f.apply(null, [accum, head(xs)]), tail(xs));
}

/**
 * foldl(f, init, xs) pliega el vector xs por la izquierda aplicando la
 * función f con el valor inicial init.
 * @example
 * foldl(function (accum, it) { return accum + it; }, 0, [1, 2, 3]) => 6
 *
 * @param {Function} f Función a aplicar
 * @param {Object} init Valor inicial
 * @param {Array} xs Vector
 * @return {Object} El plegado de xs aplicando f con valor inicial init
 *
 * @since 0.1
 */
function foldl(f, init, xs) {
    return foldlAux(f, init, xs);
}

/**
 * foldl(f, xs) pliega el vector xs por la izquierda aplicando la
 * función f con el primer elemento de xs como valor inicial, luego xs
 * no puede estar vacío.
 * @example
 * foldl(function (accum, it) { return accum + it; }, [1, 2, 3]) => 6
 *
 * @param {Function} f Función a aplicar
 * @param {Object} init Valor inicial
 * @param {Array} xs Vector
 * @return {Object} El plegado por la izquierda de xs aplicando f con el primer
 *        elemento xs como valor inicial
 *
 * @since 0.1
 */
function foldl1(f, xs) {
    checkIfNullOrEmpty("foldl1", xs);
    return foldlAux(f, head(xs), tail(xs));
}

/**
 * foldrAux(f, init, xs) es una función auxiliar encargada de recorrer
 * el vector por la derecha aplicando la función f.
 * @example
 * foldrAux(function (accum, it) { return accum + it; }, 0, [1, 2, 3]) => 6
 *
 * @param {Function} f Función a aplicar
 * @param {Object} accum Valor acumulado
 * @param {Array} xs Vector
 * @return {Object} El valor acumulado tras plegar el vector xs por la derecha aplicando la
 *        función f
 *
 * @since 0.1
 */
function foldrAux(f, accum, xs) {
    if (isNullOrEmpty(xs))
        return accum;
    return foldrAux(f, f.apply(null, [accum, last(xs)]), (xs.length > 1)? init(xs) : []);
}

/**
 * foldr(f, init, xs) pliega el vector xs por la derecha aplicando la
 * función f con el valor inicial init.
 * @example
 * foldr(function (accum, it) { return accum + it; }, 0, [1, 2, 3]) => 6
 *
 * @param {Function} f Función a aplicar
 * @param {Object} init Valor inicial
 * @param {Array} xs Vector
 * @return {Object} El plegado por la izquierda de xs aplicando f con valor inicial init
 *
 * @since 0.1
 */
function foldr(f, init, xs) {
    return foldrAux(f, init, xs);
}

/**
 * foldr(f, xs) pliega el vector xs por la derecha aplicando la función
 * f con el primer elemento de xs como valor inicial, luego xs no
 * puede estar vacío.
 * @example
 * foldr(function (accum, it) { return accum + it; }, 0, [1, 2, 3]) => 6
 *
 * @param {Function} f Función a aplicar
 * @param {Object} init Valor inicial
 * @param {Array} xs Vector
 * @return {Object} El plegado por la derecha de xs aplicando f con el primer
 *        elemento xs como valor inicial
 *
 * @since 0.1
 */
function foldr1(f, xs) {
    checkIfNullOrEmpty("foldr1", xs);
    return foldrAux(f, last(xs), (xs.length > 1)? init(xs) : []);
}

/**
 * Plegados especiales
 **/

/**
 * and(xs) retorna la conjunción de un vector booleano.
 * @example
 * and([true, true, false]) => false
 *
 * @param {Array} xs Vector
 * @return {Boolean} Conjunción booleana de xs
 *
 * @since 0.1
 */
function and(xs) {
  return foldl1(function (ac, it) { return ac && it; }, xs);
}

/**
 * or(xs) retorna la disyunción de un vector booleano.
 * @example
 * or([true, true, false]) => true
 *
 * @param {Array} xs Vector
 * @return {Boolean} Disyunción booleana de xs
 *
 * @since 0.1
 */
function or(xs) {
  return foldl1(function (ac, it) { return ac || it; }, xs);
}

/**
 * any(p, xs) retorna true si alguno de los elementos de xs cumple el predicado p.
 * @example
 * any(function (it) { return it % 2 == 0; }, [1, 2, 3, 5]) => true
 *
 * @param {Function} p Predicado
 * @param {Array} xs Vector
 * @return {Boolean} true si alguno de los elementos de xs satisfacen p, False e.o.c
 *
 * @since 0.1
 */
/***
 * La definición ideal sería: or(filter(p, xs))
 * pero se realiza la iteración manualmente para acelerar el método
 ***/
function any(p, xs) {
  for (var i = 0; i < xs.length; i++) {
      if (p.apply(null, [xs[i]]))
          return true;
  }
  return false;
}

/**
 * all(p, xs) retorna true si todos los elementos de xs cumplen el predicado p.
 * @example
 * all((function (it) { return it % 2 == 0; }, [1, 3, 5, 7]) => false
 *
 * @param {Function} p Predicado
 * @param {Array} xs Vector
 * @return {Boolean} true si todos los elementos de xs satisfacen p, False e.o.c
 *
 * @since 0.1
 */
/***
 * La definición ideal sería: and(filter(p, xs))
 * pero se realiza la iteración manualmente para acelerar el método
 ***/
function all(p, xs) {
  for (var i = 0; i < xs.length; i++) {
      if (!p.apply(null, [xs[i]]))
          return false;
  }
  return true;
}

/**
 * sum(xs) retorna la suma de todos los elementos de xs.
 * @example
 * sum([1, 3, 5, 7]) => 16
 *
 * @param {Array} xs Vector
 * @return {Number} Sumatorio de xs
 *
 * @since 0.1
 */
function sum(xs) {
    return foldl1(function (ac, it) { return ac + it;}, xs);
}

/**
 * product(xs) retorna el producto de todos los elementos de xs.
 * @example
 * sum([1, 2, 3]) => 6
 *
 * @param {Array} xs Vector
 * @return {Number} Productorio de xs
 *
 * @since 0.1
 */
function product(xs) {
    return foldl1(function (ac, it) { return ac * it;}, xs);
}

/**
 * flatten(xs) retorna la concatenación del vector de vectores xs.
 * @example
 * flatten([[1, 2],  [3, 4], [5, 6]]) => [1, 2, 3, 4, 5, 6]
 *
 * @param {Array} xs Vector
 * @return {Array} El vector xs aplanado
 *
 * @since 0.1
 */
function flatten(xs) {
    return foldl1(function (ac, it) { return concat(ac, it); }, xs);
}

/**
 * concatMap(xs) retorna vector obtenido de concatenar el vector
 * resultante de aplicar f a cada elemento del vector xs.
 * @example
 * concatMap(function (e) { return e + "! "; }, ["Hey", "Ho", "Let's go"]) == "Hey! Ho! Let's go! "
 *
 * @param {Array} xs Vector
 * @return {Array} El vector xs aplanado
 *
 * @since 0.1
 */
function concatMap(f, xs) {
    return flatten(map(f, xs));
}

/**
 * maximum(xs) retorna el mayor elemento de la vector xs.
 * @example
 * maximum([1, 2, 3, 4]) => 4
 *
 * @param {Array} xs Vector
 * @return {Object} El mayor elemento de xs
 *
 * @since 0.1
 */
function maximum(xs) {
    return foldl1(function (ac, it) { return (it > ac)? it : ac; }, xs);
}

/**
 * minimum(xs) retorna el menor elemento de la vector xs.
 * @example
 * maximum([1, 2, 3, 4]) => 1
 *
 * @param {Array} xs Vector
 * @return {Object} El menor elemento de xs
 *
 * @since 0.1
 */
function minimum(xs) {
    return foldl1(function (ac, it) { return (it < ac)? it : ac; }, xs);
}

/**
 * Constructores de vectores
 **/
/**
 * scanlAux(f, xs) es una función auxiliar encargada de recorrer el
 * vector por la izquierda acumulando los resultados de aplicar f.
 * @example
 * scanlAux(function (ac, it) { return ac + it; }, 0, [1, 2, 3, 4]) => [0, 1, 3, 6, 10]
 *
 * @param {Array} xs Vector
 * @return {Array} El vector acumulativo de aplicar f por la izquierda en los
 *        elementos de xs
 *
 * @since 0.1
 */
function scanlAux(f, accum, result, xs) {
    if (isNullOrEmpty(xs))
        return result;
    var accumAux = f.apply(null, [accum, head(xs)]);
    result.push(accumAux);
    return scanlAux(f, accumAux, result, tail(xs));
}

/**
 * scanl(f, init, xs) retorna el vector de las sucesivas aplicaciones
 * por la izquierda acumuladas de f en xs con init como valor inicial.
 * @example
 * scanl(function (ac, it) { return ac + it; }, 0, [1, 2, 3, 4]) => [0, 1, 3, 6, 10]
 *
 * @param {Array} xs Vector
 * @param {Object} init Valor inicial
 * @param {Array} xs Vector
 * @return {Array} El vector acumulativo de aplicar f por la izquierda en los
 *        elementos de xs con init como valor inicial
 *
 * @since 0.1
 */
function scanl(f, init, xs) {
    return scanlAux(f, init, [init], xs);
}

/**
 * scanl1(f, xs) retorna el vector de las sucesivas aplicaciones por
 * la izquierda acumuladas de f en xs con el primer elemento de xs
 * como valor inicial.
 * @example
 * scanl1(function (ac, it) { return ac + it; }, [1, 2, 3, 4]) => [1, 3, 6, 10]
 *
 * @param {Array} xs Vector
 * @param {Object} init Valor inicial
 * @param {Array} xs Vector
 * @return {Array} El vector acumulativo de aplicar f por la izquierda en los
 *        elementos de xs con el primer elemento como valor inicial.
 *
 * @since 0.1
 */
function scanl1(f, xs) {
    var init = head(xs);
    return scanlAux(f, init, [init], tail(xs));
}

/**
 * scanrAux(f, xs) es una función auxiliar encargada de recorrer el
 * vector por la derecha acumulando los resultados de aplicar f.
 * @example
 * scanrAux(function (ac, it) { return ac + it; }, 0, [1, 2, 3, 4]) => [0, 4, 7, 9, 10]
 *
 * @param {Array} xs Vector
 * @return {Array} El vector acumulativo de aplicar f por la derecha en los
 *        elementos de xs recorriendo por la drecha
 *
 * @since 0.1
 */
function scanrAux(f, accum, result, xs) {
    if (isNullOrEmpty(xs))
        return result;
    var accumAux = f.apply(null, [accum, last(xs)]);
    result.push(accumAux);
    return scanrAux(f, accumAux, result, (xs.length > 1)? init(xs) : []);
}

/**
 * scanr(f, init, xs) retorna el vector de las sucesivas aplicaciones
 * por la derecha acumuladas de f en xs con init como valor inicial.
 * @example
 * scanr(function (ac, it) { return ac + it; }, 0, [1, 2, 3, 4]) => [0, 4, 7, 9, 10]
 *
 * @param {Array} xs Vector
 * @param {Object} init Valor inicial
 * @param {Array} xs Vector
 * @return {Array} El vector acumulativo de aplicar f por la derecha en los
 *        elementos de xs con init como valor inicial
 *
 * @since 0.1
 */
function scanr(f, init, xs) {
    return scanrAux(f, init, [init], xs);
}

/**
 * scanr1(f, xs) retorna el vector de las sucesivas aplicaciones
 * acumuladas de f en xs con el primer elemento de xs como valor
 * inicial.
 * @example
 * scanr(function (ac, it) { return ac + it; }, [1, 2, 3, 4]) => [4, 7, 9, 10]
 *
 * @param {Array} xs Vector
 * @param {Object} init Valor inicial
 * @param {Array} xs Vector
 * @return {Array} El vector acumulativo de aplicar f por la derecha en los
 *        elementos de xs con el primer elemento como valor inicial.
 *
 * @since 0.1
 */
function scanr1(f, xs) {
    var initial = last(xs);
    return scanrAux(f, initial, [initial], init(xs));
}

/**
 * Vectores cuasi-infinitos
 **/
/**
 * generator(f, n) es una función auxiliar que construye un generador
 * de la función f con el argumento n como valor inicial. El segundo
 * argumento es opcional, si no se recibe un valor inicial, se asume una
 * función generadora numérica y 1 como valor inicial.
 * @example
 * var f = generator(function (n) { return ++n; });
 * f() => 2
 * f() => 3
 * ...
 *
 * @param {Function} f Función
 * @param {Object} n Valor inicial
 * @return {Function} La función generadora que aplica f
 *
 * @since 0.1
 */
function generator(f, n) {
    var result;

    if (arguments.length === 1) {
        result = 1;
    }
    else
        result = n;

    return function () {
        result = f.apply(null, [result]);
        return result;
    };
}

/**
 * iterate(f, x) retorna el vector cuasi-infinito de la aplicación
 * sucesiva de f(x)
 * @example
 * iterate(function (n) { return ++n; }, 0) => [1, 2, 3, 4, 5 ...]
 *
 * @param {Function} f Función
 * @param {Object} x Valor
 * @return {Array} El vector resultante de aplicar sucesivamente f(x)
 *
 * @since 0.1
 */
function iterate(f, x) {
    var generador = generator(f, x);
    var result = new Array();

    for (var i = 0; i < PreludeJS.cuasiInfinito; i++)
        result.push(generador());
    return result;
}

/**
 * repeatAux(x, n) retorna un vector con n repeticiones de x. El
 * parámetro n es opcional, si no recibe un valor, retorna un vector
 * cuasi-infinito.
 * @example
 * repeatAux('a', 5) => ['a', 'a', 'a', 'a', 'a'] == "aaaaa"
 *
 * @param {Object} x Valor
 * @param {Number} n Nº de repeticiones
 * @return {Array} El vector con n repeticiones de x
 *
 * @since 0.1
 */
function repeatAux(x, n) {
    var generador = generator(function (it) { return it; }, x);
    var result = new Array();
    var limite = (n)? n : PreludeJS.cuasiInfinito; 

    for (var i = 0; i < limite; i++)
        result.push(generador());
    return result;
}

/**
 * repeat(x) retorna el vector cuasi-infinito de repeticiones de x.
 * @example
 * repeat('a') => ['a', 'a', 'a', 'a', 'a', ... ] == "aaaaa..."
 *
 * @param {Object} x Valor
 * @param {Array} n Nº de repeticiones
 * @return {Array} El vector cuasi-infinito de repeticiones de x
 *
 * @since 0.1
 */
function repeat(x) {
    return repeatAux(x);
}

/**
 * replicate(x, n) retorna un vector con n repeticiones de x.
 * @example
 * replicate(5, 'a') => ['a', 'a', 'a', 'a', 'a'] == "aaaaa"
 *
 * @param {Array} x Valor
 * @param {Object} n Nº de repeticiones
 * @return {Array} El vector con n repeticiones de x
 *
 * @since 0.1
 */
function replicate(n, x) {
    return repeatAux(x, n);
}

/**
 * cycle(xs) convierte cualquier vector en un vector circular cuasi-infinito.
 * @example
 * cycle([1, 2, 3]) => [1, 2, 3, 1, 2, 3, 1, 2, 3...]
 *
 * @param {Array} xs Vector
 * @return {Array} El vector circular cuasi-infinito de xs
 *
 * @since 0.1
 */
function cycle(xs) {
    var generador = generator(function (it) { return (it+1) % xs.length; }, -1);
    var result = new Array();

    for (var i = 0; i < PreludeJS.cuasiInfinito; i++)
        result.push(xs[generador()]);
    return result;
}

/**
 * Sublistas
 **/
/**
 * take(n, xs) retorna los n primeros valores del vector xs.
 * @example
 * take(5, cycle([1, 2, 3])) => [1, 2, 3, 1, 2]
 *
 * @param {Number} n Nº de elementos a tomar
 * @param {Array} xs Vector
 * @return {Array} El vector formado por los n primeros valores de xs
 *
 * @since 0.1
 */
function take(n, xs) {
    return xs.slice(0, n);
}

/**
 * drop(n, xs) retorna el vector xs sin los n primeros valores.
 * @example
 * drop(3, [1, 2, 3, 4, 5]) => [4, 5]
 *
 * @param {Number} n Nº de elementos a despreciar
 * @param {Array} xs Vector
 * @return {Array} El vector xs sin los n primeros valores
 *
 * @since 0.1
 */
function drop(n, xs) {
    return xs.slice(n);
}

/**
 * splitAt(n, xs) retorna un vector cuyo primer elemento es un vector
 * con los n primeros valores de xs y el segundo otro vector con los
 * elementos restantes.
 * @example
 * splitAt(3, [1, 2, 3, 4, 5]) => [[1, 2, 3], [4, 5]]
 *
 * @param {Number} n Nº de elementos a dividir
 * @param {Array} xs Vector
 * @return {Array} El vector formado por los n primeros elementos de xs como
 *        primer elemento y el resto de valores de xs como segundo elemento.
 *
 * @since 0.1
 */
function splitAt(n, xs) {
    return [take(n, xs), drop(n, xs)];
}

/**
 * takeWhile(p, xs) retorna un vector con el mayor prefijo de
 * elementos de xs que cumplen el predicado p.
 * @example
 * takeWhile(function (it) { return it < 4; }, [1, 2, 3, 4, 5]) => [1, 2, 3]
 *
 * @param {Function} p Predicado
 * @param {Array} xs Vector
 * @return {Array} El vector del mayor prefijo de elementos de xs que cumplen p
 *
 * @since 0.1
 */
function takeWhile(p, xs) {
    return foldl(function (ac, it) { if (p.apply(null, [it])) ac.push(it); return ac; }, [], xs);
}

/**
 * dropWhile(p, xs) retorna un vector con el mayor sufijo de
 * elementos de xs que cumplen el predicado p.
 * @example
 * dropWhile(function (it) { return it <= 2; }, [1, 2, 3, 4, 5]) => [3, 4, 5]
 *
 * @param {Function} p Predicado
 * @param {Array} xs Vector
 * @return {Array} El vector del mayor sufijo de elementos de xs que cumplen p
 *
 * @since 0.1
 */
function dropWhile(p, xs) {
    var notP = function () { return !p.apply(null, arguments); };
    return takeWhile(notP, xs);
    // return foldl(function (ac, it) { if (!p.apply(null, [it])) ac.push(it); return ac; }, [], xs);
}

/**
 * span(p, xs) retorna un vector donde el primer elemento es el mayor prefijo de
 * elementos de xs que cumplen el predicado p y el segundo el resto de elementos de xs.
 * @example
 * span(function (it) { return it <=2; }, [1, 2, 3, 4, 5]) => [[1, 2], [3, 4, 5]]
 *
 * @param {Function} p Predicado
 * @param {Array} xs Vector
 * @return {Array} Vector cuyo primer elemento es el vector del mayor prefijo
 *        de elementos de xs que cumplen p y el resto de elementos de
 *        xs como segundo elemento
 *
 * @since 0.1
 */
function span(p, xs) {
    return [takeWhile(p, xs), dropWhile(p, xs)];
}

/**
 * unSpan(p, xs) retorna un vector donde el primer elemento es el mayor prefijo de
 * elementos de xs que no cumplen el predicado p y el segundo el resto de elementos de xs.
 * @example
 * unSpan(function (it) { return it > 2; }, [1, 2, 3, 4, 5]) => [[1, 2], [3, 4, 5]]
 *
 * @param {Function} p Predicado
 * @param {Array} xs Vector
 * @return {Array} Vector cuyo primer elemento es el vector del mayor prefijo
 *        de elementos de xs que no cumplen p y el resto de elementos de
 *        xs como segundo elemento
 *
 * @since 0.1
 */
function unSpan(p, xs) {
    var notP = function () { return !p.apply(null, arguments); };
    return span(notP, xs);
    // return [takeWhile(notP, xs), dropWhile(notP, xs)];
}

/**
 * Buscando en vectores
 **/
/**
 * elem(x, xs) retorna true si x es elemento del vector xs.
 * @example
 * elem(2, [1, 2, 3]) => true
 *
 * @param {Object} x Elemento
 * @param {Array} xs Vector
 * @return {Boolean} true si x es elemento de xs, false e.o.c 
 *
 * @since 0.1
 */
function elem(x, xs) {
    return or(map(function (it) { return it === x; }, xs));
}

/**
 * notElem(x, xs) retorna true si x no es elemento del vector xs.
 * @example
 * elem(4, [1, 2, 3]) => flase
 *
 * @param {Object} x Elemento
 * @param {Array} xs Vector
 * @return {Boolean} true si x no es elemento de xs, false e.o.c 
 *
 * @since 0.1
 */
function notElem(x, xs) {
    return !elem(x, xs);
}

/**
 * Comprimiendo y descomprimiendo vectores (zip/unzip)
 **/
/**
 * zip(xs, ys) retorna el vector formado por vectores pares con un
 * elemento de xs y otro de ys. Si alguno de los vectores de entrada
 * es más pequeño, el resto de elementos del vector mayor se descartan.
 * @example
 * zip("abcd", [1, 2, 3]) => [['a', 1], ['b', 2], ['c', 3]]
 *
 * @param {Array} xs Vector
 * @param {Array} ys Vector
 * @return {Array} Vector de vectores pares con los elementos de xs e ys
 *        correspondientes
 *
 * @since 0.1
 */
function zip(xs, ys) {
    return zipWith(function (x, y) { return new Array(x, y); }, xs, ys);
}

/**
 * zip3(xs, ys, zs) retorna el vector formado por vectores tripleta
 * con un elemento de xs, un elemento de ys y otro de zs. Si alguno de
 * los vectores de entrada es más pequeño, el resto de elementos de
 * vectores mayores se descartan.
 * @example
 * zip("abcd", [1, 2, 3], "xyztu"]) => [['a', 1, 'x'], ['b', 2, 'y'], ['c', 3, 'z']]
 *
 * @param {Array} xs Vector
 * @param {Array} ys Vector
 * @param {Array} zs Vector
 * @return {Array} Vector de vectores tripleta con los elementos de xs, ys y zs
 *        correspondientes
 *
 * @since 0.1
 */
function zip3(xs, ys, zs) {
    return zipWith3(function (x, y, z) { return new Array(x, y, z); }, xs, ys, zs);
}

/**
 * zipN(xs, ys, ...) retorna el vector formado por vectores n-tupla
 * con un elemento de cada vector recibido. Si alguno de los vectores
 * es más pequeño, el resto de elementos de los vectores mayores se
 * descartan.
 * @example
 * zipN([1, 2, 3], "abcd", [5, 6, 7, 8, 9]) == [[1, 'a', 5], [2, 'b', 6], [3, 'c', 7]]
 *
 * @param {Array} args Vectores
 * @return {Array} Vector de vectores n-tupla con los elementos de los
 *         vectores recibidos
 *
 * @since 0.2
 */
function zipN() {
    var args = Array.prototype.slice.apply(arguments);
    var minlen = minimum(foldl(function (ac, it) { ac.push(it.length); return ac; }, [], args));
    return Array.apply(null, Array(minlen)).map(function(_, i) {
        return args.map(function (a) { return a[i]; });
    });
}

/**
 * zipWith(f, xs, ys) generaliza zip comprimiendo xs e ys con la función
 * f en lugar de contruir pares. Si alguno de los vectores de entrada
 * es más pequeño, el resto de elementos del vector mayor se descartan.
 * @example
 * zipWith(function (x, y) { return x + y; }, [1, 2, 3], [4, 5, 6]) => [5, 7, 9]
 *
 * @param {Function} f Función
 * @param {Array} xs Vector
 * @param {Array} ys Vector
 * @return {Array} Vector de vectores pares con los elementos de xs e ys
 *        correspondientes
 *
 * @since 0.1
 */
function zipWith(f, xs, ys) {
    var minLength = minimum([xs.length, ys.length]);
    var result = new Array();

    for (var i = 0; i < minLength; i ++)
        result.push(f.apply(null, [xs[i], ys[i]]));

    return result;
}

/**
 * zipWith3(f, xs, ys, zs) generaliza zip3 comprimiendo xs, ys y zs con la
 * función f en lugar de construir tripletas. Si alguno de los
 * vectores de entrada es más pequeño, el resto de elementos de
 * vectores mayores se descartan.
 * @example
 * zipWith3(function (x, y, z) { return (x + y) + z; }, [1, 2, 3], [4, 5, 6], "abcdef") => [5a,7b,9c]
 *
 * @param {Function} f Función
 * @param {Array} xs Vector
 * @param {Array} ys Vector
 * @param {Array} zs Vector
 * @return {Array} Vector de vectores tripleta con los elementos de xs, ys y zs
 *        correspondientes
 *
 * @since 0.1
 */
function zipWith3(f, xs, ys, zs) {
    var minLength = minimum([xs.length, ys.length, zs.length]);
    var result = new Array();

    for (var i = 0; i < minLength; i++)
        result.push(f.apply(null, [xs[i], ys[i], zs[i]]));

    return result;
}

/**
 * zipWithN(f, xs, ys, ...) generaliza zipN comprimiendo xs, ys...  con la
 * función f en lugar de construir n-tuplas. Si alguno de los
 * vectores de entrada es más pequeño, el resto de elementos de
 * vectores mayores se descartan.
 * @example
 * zipWithN(function (x, y, z, u) { return ((x + y) * z) + u; }, [1, 2, 3], [4, 5, 6], "abcdef") => [35a,56b,81c]
 *
 * @param {Function} f Función
 * @param {Array} args Vectores
 * @return {Array} Vector de vectores n-tuplas con los elementos de xs, ys...
 *        correspondientes
 *
 * @since 0.2
 */
/***
 * La definición ideal sería:
 *   return foldl(function (ac, it) { ac.push(f.apply(null, it)); return ac; }, [],
 *                zipN.apply(null, tail(args)));
 ***/
function zipWithN(f) {
    var args = tail(Array.prototype.slice.apply(arguments));
    var minLength = minimum(foldl(function (ac, it) { ac.push(it.length); return ac; }, [], args));
    var result = new Array();

    for (var i = 0; i < minLength; i++)
        result.push(f.apply(null, map(function (it) { return it[i]; }, args)));
    return result;
}

function curry(f) {
    var args = tail(Array.prototype.slice.apply(arguments));
    if (args.length < 1)
        return f;
    return function () {
        return f.apply(null, args.concat(Array.prototype.slice.apply(arguments)));
    };
}

function nth(i, xs) {
    return xs[i];
}

function zipWithN2(f) {
    var args = tail(Array.prototype.slice.apply(arguments));
    var minLength = minimum(foldl(function (ac, it) { ac.push(it.length); return ac; }, [], args));
    var result = new Array();

    for (var i = 0; i < minLength; i++)
        result.push(f.apply(null, map(curry(nth, i), args)));
    return result;
}

/**
 * unzip(xs) transforma un vector de vectores pares en un vector par
 * con el vector de primeros componentes y otro vector de segundos
 * componentes. El vector de entrada debe ser un vector de pares.
 * @example
 * unzip([[1, 'a'], [2, 'b'], [3, 'c']]) => [[1, 2, 3], ['a', 'b', 'c']]
 *
 * @param {Array} xs Vector
 * @return {Array} Vector par con el vector de primeros componentes y el
 *        vector de segundos componentes
 *
 * @since 0.1
 */
function unzip(xs) {
    if (!and(map(function (it) { return (it instanceof Array) && (it.length === 2); },
                 xs)))
        throw exception("Error",
                        "unzip: El vector no es un vector de pares.",
                        "<i>unzip</i>: El vector no es un vector de pares.");

    return foldl(function (ac, it) { ac[0].push(it[0]); ac[1].push(it[1]); return ac; },
                 [[], []], xs);
}

/**
 * unzip3(xs) transforma un vector de vectores de tripletas en un
 * vector tripleta con el vector de primeros componentes, el vector de
 * segundos componentes y un tercer componente con el vector de
 * terceros componentes. El vector de entrada debe ser un vector de
 * tripletas.
 * @example
 * unzip3([[1, 'a', 'x'], [2, 'b', 'y'], [3, 'c', 'z']]) => [[1, 2, 3], "abc"]
 *
 * @param {Array} xs Vector
 * @return {Array} Vector par con el vector de primeros componentes, el vector
 *        de segundos componentes y el vector de terceros componentes
 *
 * @since 0.1
 */
function unzip3(xs) {
    if (!and(map(function (it) { return (it instanceof Array) && (it.length === 3); },
                 xs)))
        throw exception("Error",
                        "unzip: El vector no es un vector de tripletas.",
                        "<i>unzip</i>: El vector no es un vector de tripletas.");

    return foldl(function (ac, it) {
                    ac[0].push(it[0]); ac[1].push(it[1]); ac[2].push(it[2]);
                    return ac; },
                 [[], [], []], xs);
}
