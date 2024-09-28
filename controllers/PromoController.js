import Promo from "../models/Promo.js"

export const createPromo = async (req, res) => {
    try {

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "code Promo not createds" })
    }
}


export const usePromo = async (req, res) => {
    try {
        const { codePromo } = req.body
        const { userId } = req.params

        const promo = await Promo.findOne({ codePromo })

        if (!promo) {
            return res.status(201).send({ Message: "Kòd pwomo sa pa ekziste" })
        }

        const { discount, use, maxUse, userCodeUse } = promo

        if (userCodeUse.includes(userId)) {
            return res.status(201).send({ Message: "Kòd pwomo deja itilize" })
        }

        if (use >= maxUse) {
            return res.status(201).send({ Message: " dezole kòd pwomo sa pa disponib ankò" })
        }

        res.status(200).send({ discount: discount, use: use, maxUse: maxUse })

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "Une erreur s'est produite lors de l'utilisation du code promo" })
    }
}