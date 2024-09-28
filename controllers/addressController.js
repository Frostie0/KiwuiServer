import Address from '../models/Address.js';
import User from '../models/user.js';


export const sendAddressController = async (req, res) => {
    try {
        const {
            userId, name, country, departement,
            addressId, mobileNo, city, district,
            postalCode, latitude, longitude,
            street, streetNumber, details, type, } = req.body;

        const user = await User.find({ userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }


        const address = await Address.create({
            userId, name, country, departement
            , postalCode, latitude, longitude,
            addressId, mobileNo, city, district,
            street, streetNumber, details, type,
        });


        res.status(200).json({ message: "Address created Successfully", address });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error addding address" });
    }
};

//endpoint to get all the addresses of a particular user
export const getAddressController = async (req, res) => {
    try {
        const { userId } = req.params

        const addresses = await Address.find({ userId });

        if (!addresses) {
            return res.status(400).send({ message: "Address not found" });
        }

        // const addresses = user.map(i => i.addresses)
        const defaultAddress = addresses.filter(item => item.default === true)

        res.status(200).json({ addresses, defaultAddress });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error retrieveing the addresses" });
    }
};

export const setDefault = async (req, res) => {
    try {
        const { userId } = req.params
        const { addressId } = req.body

        const addresses = await Address.find({ userId })

        if (!addresses) {
            return res.status(400).send({ message: "Address not found" });
        }

        for (const address of addresses) {
            if (addressId === address.addressId) {
                address.default = true
            }
            if (addressId !== address.addressId) {
                address.default = false
            }
            await address.save()
        }


        res.status(200).json({ messages: "Addres default update" });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Address don't update" })
    }
}

export const getAddress = async (req, res) => {
    try {
        const { addressId } = req.params

        const address = await Address.findOne({ addressId })

        if (!address) {
            return res.status(404).send({ Message: "Address not find" })
        }

        const latitude = address.latitude
        const longitude = address.longitude

        res.status(200).send({ lat: latitude, lon: longitude })

    } catch (error) {
        console.log(erro)
        res.status(500).send({ Message: "address not find" })
    }
}

export const confirmAddress = async (req, res) => {
    try {
        const { addressId } = req.params
        const { latitude, longitude } = req.body

        const address = await Address.findOne({ addressId })

        if (!address) {
            return res.status(404).send({ Message: "Address not find" })
        }

        address.latitude = latitude;
        address.longitude = longitude;
        address.verified = true;

        await address.save()

        res.status(200).send({ Message: "Address update succesfully" })

    } catch (error) {
        console.log(error)
        res.status(500).send({ Message: "Error confirm address" })
    }
}

export const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        await Address.findOneAndDelete({ addressId });

        res.status(200).send({ message: "Adresse supprimée avec succès" });

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "L'adresse n'a pas été supprimée" });
    }
};

export const changeAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { userId, name, country, departement, postalCode, latitude, longitude, mobileNo, city, district, street, streetNumber, details, type } = req.body;

        const address = await Address.findOne({ addressId });

        if (!address) {
            return res.status(404).send({ message: "Adresse non trouvée" });
        }

        // Mettre à jour les détails de l'adresse
        if (name) address.name = name;
        if (country) address.country = country;
        if (departement) address.departement = departement;
        if (postalCode) address.postalCode = postalCode;
        if (latitude) address.latitude = latitude;
        if (longitude) address.longitude = longitude;
        if (mobileNo) address.mobileNo = mobileNo;
        if (city) address.city = city;
        if (district) address.district = district;
        if (street) address.street = street;
        if (streetNumber) address.streetNumber = streetNumber;
        if (details) address.details = details;
        if (type) address.type = type;
        address.verified = false;

        // Sauvegarder les modifications
        const updatedAddress = await address.save();

        res.status(200).send({ message: "Adresse mise à jour avec succès", updatedAddress });

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Erreur lors de la mise à jour de l'adresse" });
    }
}

